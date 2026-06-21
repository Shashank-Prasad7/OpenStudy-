"""Background cleanup for completed Pomodoro hashes."""

import asyncio
import time
from contextlib import suppress

import structlog
from redis.asyncio import Redis

logger = structlog.get_logger(__name__)
DEFAULT_RETENTION_HOURS = 24


async def cleanup_redis(redis: Redis, retention_hours: int = DEFAULT_RETENTION_HOURS) -> None:
    cutoff = int(time.time()) - (retention_hours * 3600)
    async for key in redis.scan_iter(match="room:*:pomodoro"):
        try:
            state = await redis.hgetall(key)
            if state.get("status") != "completed":
                continue
            completed_at = int(state.get("completed_at", "0") or 0)
            if completed_at and completed_at < cutoff:
                await redis.delete(key)
                logger.info("purged_stale_pomodoro", key=key)
        except Exception as exc:  # pragma: no cover
            logger.warning("cleanup_error", key=key, error=str(exc))


async def start_cleanup_task(app, interval_seconds: int = 3600, retention_hours: int = DEFAULT_RETENTION_HOURS) -> None:
    redis: Redis | None = getattr(app.state, "redis", None)
    if redis is None:
        app.state.cleanup_task = None
        return

    async def runner() -> None:
        while True:
            await cleanup_redis(redis, retention_hours)
            await asyncio.sleep(interval_seconds)

    app.state.cleanup_task = asyncio.create_task(runner())


async def stop_cleanup_task(app) -> None:
    task = getattr(app.state, "cleanup_task", None)
    if task is None:
        return
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
