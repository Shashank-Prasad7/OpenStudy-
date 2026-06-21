from datetime import UTC, datetime, timedelta

import pytest

from app.main import app
from app.schemas.ai import StudyPlanRequest
from app.services.groq_service import generate_study_plan


def test_architecture_routes_are_registered() -> None:
    paths = {route.path for route in app.routes}
    required = {
        "/api/auth/register",
        "/api/auth/login",
        "/api/rooms",
        "/api/goals",
        "/api/matches",
        "/api/ai/study-plan",
        "/api/users/me",
        "/api/users/me/preferences",
        "/api/users/me/stats",
        "/ws/{room_id}",
    }
    assert required <= paths


@pytest.mark.asyncio
async def test_ai_planner_has_local_fallback_without_api_key() -> None:
    payload = StudyPlanRequest(
        exam_name="Java exam",
        exam_date=datetime.now(UTC).date() + timedelta(days=2),
        topics=["OOP", "Collections"],
        hours_per_day=2,
        current_level="intermediate",
    )

    plan = await generate_study_plan(payload)

    assert plan.exam_name == "Java exam"
    assert len(plan.plan) == 3
    assert all(day.pomodoros >= 1 for day in plan.plan)
