"""Background task to clean up stale Pomodoro state in Redis.

Runs periodically (default every hour) and deletes keys matching ``room:{room_id}:pomodoro``
when the stored state indicates a completed session older than the configured retention period.
"""
import asyncio
import json
from datetime import datetime, timedelta, timezone

import structlog
from redis.asyncio import Redis

logger = structlog.get_logger(__name__)

# Default retention – can be overridden via settings
DEFAULT_RETENTION_HOURS = 24

async def _should_delete(state: dict, retention: timedelta) -> bool:
    """Determine if a Pomodoro state should be removed.

    The Redis value is stored as JSON with fields ``status`` and ``updated_at``.
    ``status`` == "completed" and ``updated_at`` older than ``retention`` → delete.
    """
    if state.get("status") != "completed":
        return False
    updated_at = state.get("updated_at")
    if not updated_at:
        return False
    try:
        ts = datetime.fromisoformat(updated_at).replace(tzinfo=timezone.utc)
    except Exception:
        return False
    return datetime.now(timezone.utc) - ts > retention

async def cleanup_redis(redis: Redis, retention_hours: int = DEFAULT_RETENTION_HOURS) -> None:
    """Iterate over Pomodoro keys and delete stale entries.

    Args:
        redis: Async Redis client.
        retention_hours: Hours to keep completed sessions.
    """
    pattern = "room:*:pomodoro"
    retention = timedelta(hours=retention_hours)
    async for key in redis.scan_iter(match=pattern):
        try:
            raw = await redis.get(key)
            if not raw:
                continue
            state = json.loads(raw)
            if await _should_delete(state, retention):
                await redis.delete(key)
                logger.info("purged_stale_pomodoro", key=key)
        except Exception as exc:  # pragma: no cover
            logger.error("cleanup_error", key=key, error=str(exc))

async def start_cleanup_task(app, interval_seconds: int = 3600, retention_hours: int = DEFAULT_RETENTION_HOURS):
    """Launch a perpetual asyncio task that runs ``cleanup_redis`` every ``interval_seconds``.
    This is intended to be called from ``app.on_event('startup')``.
    """
    redis: Redis = app.state.redis
    async def _runner():
        while True:
            try:
                await cleanup_redis(redis, retention_hours)
            except Exception as exc:  # pragma: no cover
                logger.exception("cleanup_loop_failure", error=str(exc))
            await asyncio.sleep(interval_seconds)
    app.state._cleanup_task = asyncio.create_task(_runner())
