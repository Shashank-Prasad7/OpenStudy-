from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.utils import api_error

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_token(subject: UUID, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key.get_secret_value(), algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_type: str) -> dict[str, str | int]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key.get_secret_value(), algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.", "invalid_token") from exc

    if payload.get("type") != expected_type:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Invalid token type.", "invalid_token")
    return payload


def _cookie_kwargs(max_age: int) -> dict[str, str | int | bool | None]:
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "none" if settings.cookie_secure else "lax",
        "domain": settings.cookie_domain or None,
        "path": "/",
        "max_age": max_age,
    }


def set_auth_cookies(response: Response, user_id: UUID) -> None:
    access_seconds = settings.access_token_expire_minutes * 60
    refresh_seconds = settings.refresh_token_expire_days * 24 * 60 * 60
    response.set_cookie(
        "access_token",
        create_token(user_id, "access", timedelta(seconds=access_seconds)),
        **_cookie_kwargs(access_seconds),
    )
    response.set_cookie(
        "refresh_token",
        create_token(user_id, "refresh", timedelta(seconds=refresh_seconds)),
        **_cookie_kwargs(refresh_seconds),
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/", domain=settings.cookie_domain or None)
    response.delete_cookie("refresh_token", path="/", domain=settings.cookie_domain or None)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
