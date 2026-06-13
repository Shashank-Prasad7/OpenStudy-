from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import StudyPlanRequest, StudyPlanResponse
from app.services.groq_service import generate_study_plan

router = APIRouter(prefix="/ai", tags=["ai study planner"])


@router.post("/study-plan", response_model=StudyPlanResponse)
async def create_study_plan(
    payload: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
) -> StudyPlanResponse:
    """Generate a Pomodoro-friendly AI study plan with Groq Llama 3."""

    _ = current_user
    return await generate_study_plan(payload)
