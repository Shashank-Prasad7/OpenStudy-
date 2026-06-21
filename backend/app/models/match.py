import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.user import User


class MatchStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class PartnerMatch(Base):
    """Suggested accountability partner pairing."""

    __tablename__ = "partner_matches"
    __table_args__ = (
        CheckConstraint("user_a_id <> user_b_id", name="distinct_users"),
        CheckConstraint("match_score >= 0 and match_score <= 1", name="score_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus, name="match_status"),
        nullable=False,
        default=MatchStatus.pending,
        server_default=MatchStatus.pending.value,
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=text("timezone('utc', now())"),
    )

    user_a: Mapped["User"] = relationship(back_populates="matches_as_a", foreign_keys=[user_a_id])
    user_b: Mapped["User"] = relationship(back_populates="matches_as_b", foreign_keys=[user_b_id])
