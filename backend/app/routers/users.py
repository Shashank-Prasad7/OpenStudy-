from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.goal import Goal
from app.models.pomodoro import PomodoroSession, PomodoroStatus
from app.models.preference import Preference
from app.models.room import RoomMember
from app.models.user import User
from app.schemas.auth import UserRead, UserUpdate
from app.schemas.match import PreferenceRead, PreferenceUpsert
from app.schemas.stats import UserStats, WeeklyFocusDay
from app.utils import not_found

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    updates = payload.model_dump(exclude_unset=True)
    if "avatar_url" in updates and updates["avatar_url"] is not None:
        updates["avatar_url"] = str(updates["avatar_url"])
    for field, value in updates.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/preferences", response_model=PreferenceRead)
async def read_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Preference:
    preference = await db.scalar(select(Preference).where(Preference.user_id == current_user.id))
    if preference is None:
        raise not_found("Study preferences")
    return preference


@router.patch("/me/preferences", response_model=PreferenceRead, status_code=status.HTTP_200_OK)
async def upsert_preferences(
    payload: PreferenceUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Preference:
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


@router.get("/me/stats", response_model=UserStats)
async def read_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserStats:
    completed_goals = await db.scalar(
        select(func.count()).select_from(Goal).where(Goal.user_id == current_user.id, Goal.completed.is_(True))
    )
    active_rooms = await db.scalar(
        select(func.count()).select_from(RoomMember).where(RoomMember.user_id == current_user.id)
    )

    session_rows = (
        await db.execute(
            select(PomodoroSession.ended_at, PomodoroSession.duration_mins)
            .join(RoomMember, RoomMember.room_id == PomodoroSession.room_id)
            .where(RoomMember.user_id == current_user.id, PomodoroSession.status == PomodoroStatus.completed)
        )
    ).all()
    focus_minutes = sum(row.duration_mins for row in session_rows)

    today = datetime.now(UTC).date()
    week_start = today - timedelta(days=today.weekday())
    by_day = {week_start + timedelta(days=index): 0 for index in range(7)}
    for row in session_rows:
        if row.ended_at is not None and row.ended_at.date() in by_day:
            by_day[row.ended_at.date()] += row.duration_mins

    return UserStats(
        streak_count=current_user.streak_count,
        focus_minutes=focus_minutes,
        completed_goals=completed_goals or 0,
        active_rooms=active_rooms or 0,
        weekly_focus=[WeeklyFocusDay(date=day, minutes=minutes) for day, minutes in by_day.items()],
    )
