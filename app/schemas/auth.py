from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    bio: str | None = Field(default=None, max_length=1000)
    timezone: str = Field(default="UTC", min_length=1, max_length=50)
    avatar_url: HttpUrl | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)
    timezone: str | None = Field(default=None, min_length=1, max_length=50)
    avatar_url: HttpUrl | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    bio: str | None
    timezone: str
    avatar_url: str | None
    streak_count: int
    created_at: datetime


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    avatar_url: str | None
    timezone: str


class AuthResponse(BaseModel):
    user: UserRead
    token_type: str = "bearer"
