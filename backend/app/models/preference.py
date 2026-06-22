import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class StudyTime(str, enum.Enum):
    morning = "morning"
    evening = "evening"
    night = "night"


class StudyStyle(str, enum.Enum):
    solo = "solo"
    group = "group"
    mix = "mix"


class Preference(Base):
    """User matching preferences used by the accountability partner algorithm."""

    __tablename__ = "preferences"
    __table_args__ = (UniqueConstraint("user_id", name="uq_preferences_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    subjects: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    study_time: Mapped[StudyTime] = mapped_column(
        Enum(StudyTime, name="study_time"),
        nullable=False,
    )

    style: Mapped[StudyStyle] = mapped_column(
        Enum(StudyStyle, name="study_style"),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="preference")
