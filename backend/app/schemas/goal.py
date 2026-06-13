from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    deadline: datetime | None = None


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    completed: bool | None = None
    deadline: datetime | None = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    completed: bool
    deadline: datetime | None
    created_at: datetime


class SessionNoteCreate(BaseModel):
    session_id: UUID
    note_text: str = Field(min_length=1, max_length=240)

    @field_validator("note_text")
    @classmethod
    def one_line_note(cls, value: str) -> str:
        cleaned = " ".join(value.splitlines()).strip()
        if not cleaned:
            raise ValueError("note_text cannot be blank")
        return cleaned


class SessionNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    session_id: UUID
    note_text: str
    created_at: datetime
