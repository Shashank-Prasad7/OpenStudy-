import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.goal import Goal, SessionNote
    from app.models.match import PartnerMatch
    from app.models.preference import Preference
    from app.models.room import RoomMember, StudyRoom
    from app.models.study_plan import SavedStudyPlan


class User(Base):
    """Registered OpenStudy user."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="UTC")
    avatar_url: Mapped[str | None] = mapped_column(Text)
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_study_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("timezone('utc', now())"),
    )

    rooms_created: Mapped[list["StudyRoom"]] = relationship(back_populates="creator", cascade="all, delete-orphan")
    memberships: Mapped[list["RoomMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preference: Mapped["Preference | None"] = relationship(back_populates="user", cascade="all, delete-orphan")
    session_notes: Mapped[list["SessionNote"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    matches_as_a: Mapped[list["PartnerMatch"]] = relationship(
        back_populates="user_a",
        foreign_keys="PartnerMatch.user_a_id",
        cascade="all, delete-orphan",
    )
    matches_as_b: Mapped[list["PartnerMatch"]] = relationship(
        back_populates="user_b",
        foreign_keys="PartnerMatch.user_b_id",
        cascade="all, delete-orphan",
    )
    study_plans: Mapped[list["SavedStudyPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")


from app.models import goal as _goal  # noqa: E402,F401
from app.models import match as _match  # noqa: E402,F401
from app.models import pomodoro as _pomodoro  # noqa: E402,F401
from app.models import preference as _preference  # noqa: E402,F401
from app.models import room as _room  # noqa: E402,F401
from app.models import study_plan as _study_plan  # noqa: E402,F401
