import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.pomodoro import PomodoroSession
    from app.models.user import User


class Goal(Base):
    """A user's study goal or session intention."""

    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    deadline: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("timezone('utc', now())"),
    )

    user: Mapped["User"] = relationship(back_populates="goals")


class SessionNote(Base):
    """One-line reflection captured after a Pomodoro session."""

    __tablename__ = "session_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pomodoro_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("timezone('utc', now())"),
    )

    user: Mapped["User"] = relationship(back_populates="session_notes")
    session: Mapped["PomodoroSession"] = relationship(back_populates="notes")
