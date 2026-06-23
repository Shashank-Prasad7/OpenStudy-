import time
from dataclasses import dataclass
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now
from app.models.pomodoro import PomodoroSession, PomodoroStatus

DEFAULT_DURATION_SECS = 25 * 60


def pomodoro_key(room_id: UUID) -> str:
    return f"room:{room_id}:pomodoro"


@dataclass(frozen=True)
class PomodoroState:
    status: str
    remaining_secs: int
    duration_secs: int
    session_id: str | None = None
    started_at: float | None = None


async def get_pomodoro_state(redis: Redis, room_id: UUID) -> PomodoroState:
    raw = await redis.hgetall(pomodoro_key(room_id))
    if not raw:
        return PomodoroState(status="idle", remaining_secs=DEFAULT_DURATION_SECS, duration_secs=DEFAULT_DURATION_SECS)

    status = str(raw.get("status", "idle"))
    duration = int(raw.get("duration", DEFAULT_DURATION_SECS))
    remaining = int(raw.get("remaining", duration))
    started_at = float(raw["start_time"]) if raw.get("start_time") else None

    if status == "active" and started_at is not None:
        elapsed = int(time.time() - started_at)
        remaining = max(remaining - elapsed, 0)

    return PomodoroState(
        status="completed" if status == "active" and remaining <= 0 else status,
        remaining_secs=remaining,
        duration_secs=duration,
        session_id=raw.get("session_id"),
        started_at=started_at,
    )


async def start_pomodoro(redis: Redis, db: AsyncSession, room_id: UUID, duration_mins: int) -> PomodoroState:
    existing = await get_pomodoro_state(redis, room_id)
    if existing.status == "active":
        return existing

    if existing.status == "paused" and existing.session_id:
        await redis.hset(
            pomodoro_key(room_id),
            mapping={
                "status": "active",
                "start_time": str(int(time.time())),
                "remaining": str(existing.remaining_secs),
            },
        )
        await redis.expire(pomodoro_key(room_id), existing.remaining_secs + 86400)
        session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(existing.session_id)))
        if session:
            session.status = PomodoroStatus.active
            session.ended_at = None
            await db.commit()
        return await get_pomodoro_state(redis, room_id)

    session = PomodoroSession(
        room_id=room_id,
        duration_mins=duration_mins,
        status=PomodoroStatus.active,
        started_at=utc_now(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    duration_secs = duration_mins * 60
    await redis.hset(
        pomodoro_key(room_id),
        mapping={
            "status": "active",
            "start_time": str(int(time.time())),
            "duration": str(duration_secs),
            "remaining": str(duration_secs),
            "session_id": str(session.id),
            "completed_at": "",
        },
    )
    await redis.expire(pomodoro_key(room_id), duration_secs + 86400)
    return await get_pomodoro_state(redis, room_id)


async def pause_pomodoro(redis: Redis, db: AsyncSession, room_id: UUID) -> PomodoroState:
    state = await get_pomodoro_state(redis, room_id)
    if state.status == "active":
        await redis.hset(
            pomodoro_key(room_id),
            mapping={"status": "paused", "remaining": str(state.remaining_secs), "start_time": ""},
        )
        if state.session_id:
            session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(state.session_id)))
            if session:
                session.status = PomodoroStatus.paused
                await db.commit()
    return await get_pomodoro_state(redis, room_id)


async def reset_pomodoro(redis: Redis, db: AsyncSession, room_id: UUID) -> PomodoroState:
    state = await get_pomodoro_state(redis, room_id)
    if state.session_id:
        session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(state.session_id)))
        if session and session.status != PomodoroStatus.completed:
            session.status = PomodoroStatus.paused
            session.ended_at = utc_now()
            await db.commit()
    await redis.delete(pomodoro_key(room_id))
    return PomodoroState(status="idle", remaining_secs=DEFAULT_DURATION_SECS, duration_secs=DEFAULT_DURATION_SECS)


async def complete_pomodoro_once(redis: Redis, db: AsyncSession, room_id: UUID, state: PomodoroState) -> str | None:
    if not state.session_id:
        return None

    done_key = f"{pomodoro_key(room_id)}:done:{state.session_id}"
    claimed = await redis.set(done_key, "1", ex=86400, nx=True)
    await redis.hset(
        pomodoro_key(room_id),
        mapping={
            "status": "completed",
            "remaining": "0",
            "start_time": "",
            "completed_at": str(int(time.time())),
        },
    )
    if not claimed:
        return None

    session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(state.session_id)))
    if session:
        session.status = PomodoroStatus.completed
        session.ended_at = utc_now()
        await db.commit()
    return state.session_id
