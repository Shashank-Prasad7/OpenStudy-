import time
from dataclasses import dataclass
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now
from app.models.pomodoro import PomodoroSession, PomodoroStatus


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
    """Read the Redis hash and calculate a consistent remaining time."""

    raw = await redis.hgetall(pomodoro_key(room_id))
    if not raw:
        return PomodoroState(status="idle", remaining_secs=0, duration_secs=0)

    status = str(raw.get("status", "idle"))
    duration = int(raw.get("duration", 0))
    remaining = int(raw.get("remaining", duration))
    started_at = float(raw["start_time"]) if raw.get("start_time") else None

    if status == "active" and started_at is not None:
        elapsed = int(time.time() - started_at)
        remaining = max(duration - elapsed, 0)

    return PomodoroState(
        status="completed" if status == "active" and remaining <= 0 else status,
        remaining_secs=remaining,
        duration_secs=duration,
        session_id=raw.get("session_id"),
        started_at=started_at,
    )


async def start_pomodoro(redis: Redis, db: AsyncSession, room_id: UUID, duration_mins: int) -> PomodoroState:
    """Start a room Pomodoro and persist the backing session row."""

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
        },
    )
    await redis.expire(pomodoro_key(room_id), duration_secs + 86400)
    return await get_pomodoro_state(redis, room_id)


async def pause_pomodoro(redis: Redis, room_id: UUID) -> PomodoroState:
    state = await get_pomodoro_state(redis, room_id)
    if state.status == "active":
        await redis.hset(
            pomodoro_key(room_id),
            mapping={"status": "paused", "remaining": str(state.remaining_secs), "start_time": ""},
        )
    return await get_pomodoro_state(redis, room_id)


async def reset_pomodoro(redis: Redis, db: AsyncSession, room_id: UUID) -> PomodoroState:
    state = await get_pomodoro_state(redis, room_id)
    if state.session_id:
        session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(state.session_id)))
        if session and session.status == PomodoroStatus.active:
            session.status = PomodoroStatus.paused
            session.ended_at = utc_now()
            await db.commit()
    await redis.delete(pomodoro_key(room_id))
    return PomodoroState(status="idle", remaining_secs=0, duration_secs=0)


async def complete_pomodoro_once(redis: Redis, db: AsyncSession, room_id: UUID, state: PomodoroState) -> str | None:
    """Mark a finished Pomodoro complete, returning the session id only once across instances."""

    if not state.session_id:
        return None

    done_key = f"{pomodoro_key(room_id)}:done:{state.session_id}"
    claimed = await redis.set(done_key, "1", ex=86400, nx=True)
    await redis.hset(pomodoro_key(room_id), mapping={"status": "completed", "remaining": "0", "start_time": ""})
    if not claimed:
        return None

    session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == UUID(state.session_id)))
    if session:
        session.status = PomodoroStatus.completed
        session.ended_at = utc_now()
        await db.commit()
    return state.session_id
