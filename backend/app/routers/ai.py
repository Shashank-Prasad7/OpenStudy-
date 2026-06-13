from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, rate_limit
from app.models.user import User
from app.schemas.ai import StudyPlanRequest, StudyPlanResponse
from app.services.groq_service import generate_study_plan

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
