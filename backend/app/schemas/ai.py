from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- Legacy schemas (kept for backward compatibility) ----------

class StudyPlanRequest(BaseModel):
    exam_name: str = Field(min_length=1, max_length=120)
    exam_date: date
    topics: list[str] = Field(min_length=1, max_length=40)
    hours_per_day: float = Field(default=2.0, ge=0.5, le=12)
    current_level: str = Field(default="intermediate", max_length=80)
    constraints: str | None = Field(default=None, max_length=1000)


class StudyPlanDay(BaseModel):
    day: int
    date: date
    focus: str
    tasks: list[str]
    pomodoros: int
    checkpoint: str


class StudyPlanResponse(BaseModel):
    exam_name: str
    overview: str
    plan: list[StudyPlanDay]
    revision_strategy: list[str]
    risk_flags: list[str]
    raw_text: str | None = None


# ---------- New AI Study Planner schemas ----------

class AIStudyPlannerRequest(BaseModel):
    """Request body for the enhanced AI study planner."""
    subject: str = Field(min_length=1, max_length=200)
    exam: str = Field(min_length=1, max_length=200)
    level: str = Field(default="intermediate", max_length=80)
    hoursPerDay: float = Field(default=2.0, ge=0.5, le=16)
    examDate: str = Field(min_length=1, max_length=20)
    notes: str | None = Field(default=None, max_length=2000)


class PhaseItem(BaseModel):
    title: str
    duration: str
    topics: list[str]


class AIStudyPlannerResponse(BaseModel):
    """Structured response from the AI study planner."""
    overview: str = ""
    estimatedDuration: str = ""
    assessment: str = ""
    phases: list[PhaseItem] = []
    weeklyPlan: list[str] = []
    dailyRoutine: list[str] = []
    milestones: list[str] = []
    practiceStrategy: list[str] = []
    revisionStrategy: list[str] = []
    resources: list[str] = []
    examTips: list[str] = []


class SavedPlanRead(BaseModel):
    """Schema for reading a saved study plan from the database."""
    id: UUID
    subject: str
    exam: str
    level: str
    hours_per_day: float
    exam_date: str
    notes: str | None
    plan_data: dict
    created_at: str

    class Config:
        from_attributes = True


class SavedPlanCreate(BaseModel):
    """Schema for saving a generated study plan."""
    subject: str = Field(min_length=1, max_length=200)
    exam: str = Field(min_length=1, max_length=200)
    level: str = Field(max_length=80)
    hours_per_day: float = Field(ge=0.5, le=16)
    exam_date: str = Field(min_length=1, max_length=20)
    notes: str | None = Field(default=None, max_length=2000)
    plan_data: dict
