from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.match import MatchStatus
from app.models.preference import StudyStyle, StudyTime
from app.schemas.auth import UserPublic


class PreferenceUpsert(BaseModel):
    subjects: list[str] = Field(default_factory=list, max_length=20)
    study_time: StudyTime
    style: StudyStyle


class PreferenceRead(PreferenceUpsert):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID


class MatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_a_id: UUID
    user_b_id: UUID
    match_score: float
    status: MatchStatus
    created_at: datetime


class MatchSuggestion(BaseModel):
    match: MatchRead
    partner: UserPublic
    reasons: list[str]
