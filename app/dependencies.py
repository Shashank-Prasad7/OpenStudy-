from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi import Depends, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token
from app.utils import api_error

bearer_scheme = HTTPBearer(auto_error=False)


async def get_redis(request: Request) -> Redis:
    """Return the application Redis client."""

    return request.app.state.redis


def rate_limit(limit: int, window_seconds: int) -> Callable[[Request, Redis], Awaitable[None]]:
    """Simple Redis fixed-window rate limiter for sensitive endpoints."""

    async def dependency(request: Request, redis: Redis = Depends(get_redis)) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate:{request.url.path}:{client_ip}"
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, window_seconds)
        if count > limit:
            raise api_error(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Too many attempts. Please wait and try again.",
                "rate_limited",
            )

    return dependency


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated user from bearer auth or the HttpOnly access cookie."""

    token = credentials.credentials if credentials else request.cookies.get("access_token")
    if not token:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Authentication required.", "not_authenticated")

    payload = decode_token(token, expected_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token.", "invalid_token")

    user = await db.scalar(select(User).where(User.id == UUID(user_id)))
    if user is None:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "User no longer exists.", "invalid_token")
    return user
