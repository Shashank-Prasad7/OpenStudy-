from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.preference import Preference
from app.models.user import User
from app.schemas.auth import UserRead, UserUpdate
from app.schemas.match import PreferenceRead, PreferenceUpsert

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""

    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update the authenticated user's public profile fields."""

    updates = payload.model_dump(exclude_unset=True)
    if "avatar_url" in updates and updates["avatar_url"] is not None:
        updates["avatar_url"] = str(updates["avatar_url"])
    for field, value in updates.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/preferences", response_model=PreferenceRead, status_code=status.HTTP_200_OK)
async def upsert_preferences(
    payload: PreferenceUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Preference:
    """Create or update study preferences used by partner matching."""

    preference = await db.scalar(select(Preference).where(Preference.user_id == current_user.id))
    if preference is None:
        preference = Preference(user_id=current_user.id, **payload.model_dump())
        db.add(preference)
    else:
        for field, value in payload.model_dump().items():
            setattr(preference, field, value)
    await db.commit()
    await db.refresh(preference)
    return preference
