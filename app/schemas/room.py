from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.room import RoomVisibility
from app.schemas.auth import UserPublic


class RoomBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    subject_tags: list[str] = Field(default_factory=list, max_length=10)
    visibility: RoomVisibility = RoomVisibility.public
    max_members: int = Field(default=10, ge=2, le=50)

    @field_validator("subject_tags")
    @classmethod
    def normalize_tags(cls, tags: list[str]) -> list[str]:
        seen: set[str] = set()
        normalized: list[str] = []
        for tag in tags:
            value = tag.strip()
            key = value.lower()
            if value and key not in seen:
                seen.add(key)
                normalized.append(value[:40])
        return normalized


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    subject_tags: list[str] | None = Field(default=None, max_length=10)
    visibility: RoomVisibility | None = None
    max_members: int | None = Field(default=None, ge=2, le=50)


class RoomMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    joined_at: datetime
    user: UserPublic


class RoomRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    subject_tags: list[str]
    created_by: UUID
    visibility: RoomVisibility
    max_members: int
    created_at: datetime


class RoomDetail(RoomRead):
    members: list[RoomMemberRead]


class PaginatedRooms(BaseModel):
    items: list[RoomRead]
    total: int
    limit: int
    offset: int
