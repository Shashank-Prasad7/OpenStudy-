import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.pomodoro import PomodoroSession
    from app.models.user import User


class RoomVisibility(str, enum.Enum):
    public = "public"
    private = "private"


class StudyRoom(Base):
    """Collaborative study room with optional subject tags."""

    __tablename__ = "study_rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    subject_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visibility: Mapped[RoomVisibility] = mapped_column(
        Enum(RoomVisibility, name="room_visibility"),
        nullable=False,
        default=RoomVisibility.public,
        server_default=RoomVisibility.public.value,
    )
    max_members: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, server_default=text("timezone('utc', now())")
    )

    creator: Mapped["User"] = relationship(back_populates="rooms_created")
    members: Mapped[list["RoomMember"]] = relationship(back_populates="room", cascade="all, delete-orphan")
    pomodoro_sessions: Mapped[list["PomodoroSession"]] = relationship(back_populates="room", cascade="all, delete-orphan")

    @property
    def member_count(self) -> int:
        return len(self.members)


class RoomMember(Base):
    """Membership edge between users and study rooms."""

    __tablename__ = "room_members"
    __table_args__ = (UniqueConstraint("room_id", "user_id", name="uq_room_members_room_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    joined_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, server_default=text("timezone('utc', now())")
    )

    room: Mapped["StudyRoom"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")
