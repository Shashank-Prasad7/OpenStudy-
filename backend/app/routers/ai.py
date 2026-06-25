from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, rate_limit
from app.models.study_plan import SavedStudyPlan
from app.models.user import User
from app.schemas.ai import (
    AIStudyPlannerRequest,
    AIStudyPlannerResponse,
    SavedPlanCreate,
    SavedPlanRead,
    StudyPlanRequest,
    StudyPlanResponse,
)
from app.services.groq_service import generate_ai_study_plan, generate_study_plan
from app.utils import forbidden, not_found

router = APIRouter(prefix="/ai", tags=["ai study planner"])


@router.post("/study-plan", response_model=StudyPlanResponse)
async def create_study_plan(
    payload: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(rate_limit(limit=5, window_seconds=60)),
) -> StudyPlanResponse:
    """Generate a Pomodoro-friendly AI study plan with Groq Llama 3."""
    # The current_user is required for auth context; payload contains request details.
    return await generate_study_plan(payload)


# ---------------------------------------------------------------------------
# Enhanced AI Study Planner endpoints
# ---------------------------------------------------------------------------


@router.post("/study-planner/generate", response_model=AIStudyPlannerResponse)
async def generate_roadmap(
    payload: AIStudyPlannerRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(rate_limit(limit=5, window_seconds=60)),
) -> AIStudyPlannerResponse:
    """Generate a comprehensive AI-powered study roadmap."""
    return await generate_ai_study_plan(payload)


@router.post("/study-planner/save", response_model=SavedPlanRead, status_code=status.HTTP_201_CREATED)
async def save_plan(
    payload: SavedPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedStudyPlan:
    """Persist a generated study plan to the database."""
    plan = SavedStudyPlan(
        user_id=current_user.id,
        subject=payload.subject,
        exam=payload.exam,
        level=payload.level,
        hours_per_day=payload.hours_per_day,
        exam_date=payload.exam_date,
        notes=payload.notes,
        plan_data=payload.plan_data,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/study-planner/saved", response_model=list[SavedPlanRead])
async def list_saved_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavedStudyPlan]:
    """List all saved study plans for the authenticated user."""
    result = await db.scalars(
        select(SavedStudyPlan)
        .where(SavedStudyPlan.user_id == current_user.id)
        .order_by(SavedStudyPlan.created_at.desc())
    )
    return result.all()


@router.get("/study-planner/saved/{plan_id}", response_model=SavedPlanRead)
async def get_saved_plan(
    plan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedStudyPlan:
    """Retrieve a single saved study plan."""
    plan = await db.scalar(select(SavedStudyPlan).where(SavedStudyPlan.id == plan_id))
    if plan is None:
        raise not_found("Study plan")
    if plan.user_id != current_user.id:
        raise forbidden()
    return plan


@router.delete("/study-planner/saved/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_plan(
    plan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a saved study plan."""
    plan = await db.scalar(select(SavedStudyPlan).where(SavedStudyPlan.id == plan_id))
    if plan is None:
        raise not_found("Study plan")
    if plan.user_id != current_user.id:
        raise forbidden()
    await db.delete(plan)
    await db.commit()
