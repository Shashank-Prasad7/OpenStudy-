from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import rate_limit
from app.models.user import User
from app.schemas.auth import AuthResponse, UserCreate, UserLogin, UserRead
from app.services.auth import authenticate_user, clear_auth_cookies, decode_token, hash_password, set_auth_cookies
from app.utils import api_error

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])
auth_limiter = rate_limit(settings.auth_rate_limit, settings.auth_rate_limit_window_seconds)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth_limiter)])
async def register(payload: UserCreate, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Create a user account and issue access/refresh cookies."""

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        bio=payload.bio,
        timezone=payload.timezone,
        avatar_url=str(payload.avatar_url) if payload.avatar_url else None,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise api_error(status.HTTP_409_CONFLICT, "Email is already registered.", "email_taken") from exc

    await db.refresh(user)
    set_auth_cookies(response, user.id)
    return AuthResponse(user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(auth_limiter)])
async def login(payload: UserLogin, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Authenticate a user and issue new access/refresh cookies."""

    user = await authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.", "invalid_credentials")
    set_auth_cookies(response, user.id)
    return AuthResponse(user=UserRead.model_validate(user))


@router.post("/refresh", response_model=AuthResponse, dependencies=[Depends(auth_limiter)])
async def refresh_session(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Rotate access and refresh cookies using a valid refresh token."""

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "Refresh token missing.", "not_authenticated")

    payload = decode_token(refresh_token, expected_type="refresh")
    user = await db.scalar(select(User).where(User.id == UUID(str(payload["sub"]))))
    if user is None:
        raise api_error(status.HTTP_401_UNAUTHORIZED, "User no longer exists.", "invalid_token")

    set_auth_cookies(response, user.id)
    return AuthResponse(user=UserRead.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> Response:
    """Clear authentication cookies."""

    clear_auth_cookies(response)
    return response
