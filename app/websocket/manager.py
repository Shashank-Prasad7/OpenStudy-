import asyncio
from uuid import UUID

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.room import RoomMember, StudyRoom
from app.models.user import User
from app.services.auth import decode_token
from app.websocket.pomodoro import (
    complete_pomodoro_once,
    get_pomodoro_state,
    pause_pomodoro,
    reset_pomodoro,
    start_pomodoro,
)

logger = structlog.get_logger(__name__)
websocket_router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Tracks active WebSocket clients and broadcasts room-scoped events."""

    def __init__(self) -> None:
        self.active: dict[UUID, dict[UUID, WebSocket]] = {}
        self.users: dict[UUID, dict[UUID, dict[str, str | None]]] = {}
        self.tick_tasks: dict[UUID, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room_id: UUID, user: User, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active.setdefault(room_id, {})[user.id] = websocket
            self.users.setdefault(room_id, {})[user.id] = {
                "id": str(user.id),
                "name": user.name,
                "avatar": user.avatar_url,
            }

    async def disconnect(self, room_id: UUID, user_id: UUID) -> None:
        async with self._lock:
            self.active.get(room_id, {}).pop(user_id, None)
            self.users.get(room_id, {}).pop(user_id, None)
            if not self.active.get(room_id):
                self.active.pop(room_id, None)
                self.users.pop(room_id, None)
                task = self.tick_tasks.pop(room_id, None)
                if task:
                    task.cancel()

    def members(self, room_id: UUID) -> list[dict[str, str | None]]:
        return list(self.users.get(room_id, {}).values())

    async def broadcast(self, room_id: UUID, message: dict) -> None:
        dead_users: list[UUID] = []
        for user_id, websocket in list(self.active.get(room_id, {}).items()):
            try:
                await websocket.send_json(message)
            except Exception:
                dead_users.append(user_id)
        for user_id in dead_users:
            await self.disconnect(room_id, user_id)

    async def ensure_tick_loop(self, room_id: UUID, redis: Redis) -> None:
        task = self.tick_tasks.get(room_id)
        if task is None or task.done():
            self.tick_tasks[room_id] = asyncio.create_task(self._tick_loop(room_id, redis))

    async def send_room_state(self, room_id: UUID, redis: Redis) -> None:
        state = await get_pomodoro_state(redis, room_id)
        await self.broadcast(
            room_id,
            {
                "event": "room_state",
                "members": self.members(room_id),
                "pomodoro": {
                    "status": state.status,
                    "remaining_secs": state.remaining_secs,
                    "session_id": state.session_id,
                },
            },
        )

    async def _tick_loop(self, room_id: UUID, redis: Redis) -> None:
        try:
            while room_id in self.active:
                state = await get_pomodoro_state(redis, room_id)
                if state.status == "active":
                    await self.broadcast(
                        room_id,
                        {
                            "event": "pomodoro_tick",
                            "remaining_secs": state.remaining_secs,
                            "status": state.status,
                        },
                    )
                elif state.status == "completed":
                    async with AsyncSessionLocal() as db:
                        session_id = await complete_pomodoro_once(redis, db, room_id, state)
                    await self.broadcast(
                        room_id,
                        {"event": "pomodoro_tick", "remaining_secs": 0, "status": "completed"},
                    )
                    if session_id:
                        await self.broadcast(room_id, {"event": "pomodoro_done", "session_id": session_id})
                    await asyncio.sleep(1)
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            return
        except Exception as exc:
            logger.exception("pomodoro_tick_loop_failed", room_id=str(room_id), error=str(exc))


manager = ConnectionManager()


async def _authenticate_websocket(websocket: WebSocket, db: AsyncSession) -> User | None:
    token = websocket.query_params.get("token") or websocket.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = decode_token(token, expected_type="access")
        return await db.scalar(select(User).where(User.id == UUID(str(payload["sub"]))))
    except Exception:
        return None


async def _room_exists(db: AsyncSession, room_id: UUID) -> bool:
    room = await db.scalar(select(StudyRoom).where(StudyRoom.id == room_id).options(selectinload(StudyRoom.members)))
    return room is not None


async def _ensure_membership(db: AsyncSession, room_id: UUID, user_id: UUID) -> None:
    membership = await db.scalar(select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id))
    if membership is None:
        db.add(RoomMember(room_id=room_id, user_id=user_id))
        await db.commit()


@websocket_router.websocket("/ws/{room_id}")
async def room_websocket(websocket: WebSocket, room_id: UUID) -> None:
    """Authenticated room WebSocket for presence and Redis-synced Pomodoro events."""

    redis: Redis = websocket.app.state.redis
    async with AsyncSessionLocal() as db:
        user = await _authenticate_websocket(websocket, db)
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if not await _room_exists(db, room_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        await _ensure_membership(db, room_id, user.id)

    await manager.connect(room_id, user, websocket)
    await manager.ensure_tick_loop(room_id, redis)
    await manager.broadcast(room_id, {"event": "member_joined", "user": manager.users[room_id][user.id]})
    await manager.send_room_state(room_id, redis)

    try:
        while True:
            message = await websocket.receive_json()
            event = message.get("event")

            if event == "join_room":
                await manager.send_room_state(room_id, redis)
            elif event == "pomodoro_start":
                duration = int(message.get("duration", 25))
                duration = max(1, min(duration, 180))
                async with AsyncSessionLocal() as db:
                    await start_pomodoro(redis, db, room_id, duration)
                await manager.ensure_tick_loop(room_id, redis)
                await manager.send_room_state(room_id, redis)
            elif event == "pomodoro_pause":
                await pause_pomodoro(redis, room_id)
                await manager.send_room_state(room_id, redis)
            elif event == "pomodoro_reset":
                async with AsyncSessionLocal() as db:
                    await reset_pomodoro(redis, db, room_id)
                await manager.send_room_state(room_id, redis)
            elif event == "user_typing":
                await manager.broadcast(
                    room_id,
                    {
                        "event": "user_typing",
                        "user_id": str(user.id),
                        "text": str(message.get("text", ""))[:240],
                    },
                )
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(room_id, user.id)
        await manager.broadcast(room_id, {"event": "member_left", "user_id": str(user.id)})
