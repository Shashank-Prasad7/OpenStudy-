import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.goal import SessionNote
    from app.models.room import StudyRoom


class PomodoroStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class PomodoroSession(Base):
    """Persisted Pomodoro session summary for a study room."""

    __tablename__ = "pomodoro_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    duration_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PomodoroStatus] = mapped_column(Enum(PomodoroStatus, name="pomodoro_status"), nullable=False)
    started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    room: Mapped["StudyRoom"] = relationship(back_populates="pomodoro_sessions")
    notes: Mapped[list["SessionNote"]] = relationship(back_populates="session", cascade="all, delete-orphan")
