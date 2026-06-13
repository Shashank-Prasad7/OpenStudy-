from datetime import date

from pydantic import BaseModel, Field


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
