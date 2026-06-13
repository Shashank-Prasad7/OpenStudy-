from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.goal import Goal, SessionNote
from app.models.pomodoro import PomodoroSession
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate, SessionNoteCreate, SessionNoteRead
from app.utils import forbidden, not_found

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalRead])
async def list_goals(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Goal]:
    """Return the authenticated user's goals."""

    return (await db.scalars(select(Goal).where(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()))).all()


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Goal:
    """Create a goal for the authenticated user."""

    goal = Goal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.post("/session-notes", response_model=SessionNoteRead, status_code=status.HTTP_201_CREATED)
async def create_session_note(
    payload: SessionNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionNote:
    """Create the one-line note shown after a Pomodoro finishes."""

    session = await db.scalar(select(PomodoroSession).where(PomodoroSession.id == payload.session_id))
    if session is None:
        raise not_found("Pomodoro session")
    note = SessionNote(user_id=current_user.id, session_id=session.id, note_text=payload.note_text)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/session-notes", response_model=list[SessionNoteRead])
async def list_session_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SessionNote]:
    """Return the authenticated user's Pomodoro session notes."""

    return (
        await db.scalars(
            select(SessionNote).where(SessionNote.user_id == current_user.id).order_by(SessionNote.created_at.desc())
        )
    ).all()


@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Goal:
    """Update or toggle completion for a goal."""

    goal = await db.scalar(select(Goal).where(Goal.id == goal_id))
    if goal is None:
        raise not_found("Goal")
    if goal.user_id != current_user.id:
        raise forbidden()
    updates = payload.model_dump(exclude_unset=True)
    was_completed = goal.completed
    for field, value in updates.items():
        setattr(goal, field, value)
    if updates.get("completed") is True and not was_completed:
        current_user.streak_count += 1
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a goal owned by the authenticated user."""

    goal = await db.scalar(select(Goal).where(Goal.id == goal_id))
    if goal is None:
        raise not_found("Goal")
    if goal.user_id != current_user.id:
        raise forbidden()
    await db.delete(goal)
    await db.commit()
