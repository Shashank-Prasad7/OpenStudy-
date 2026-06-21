from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.match import MatchStatus, PartnerMatch
from app.models.preference import Preference
from app.models.user import User


@dataclass(frozen=True)
class ScoredPartner:
    user: User
    score: float
    reasons: list[str]


def _subject_score(a: list[str], b: list[str]) -> tuple[float, str | None]:
    left = {item.lower() for item in a}
    right = {item.lower() for item in b}
    if not left or not right:
        return 0.0, None
    overlap = left & right
    score = len(overlap) / len(left | right)
    reason = f"Shared subjects: {', '.join(sorted(overlap))}" if overlap else None
    return score, reason


def _timezone_score(a: str, b: str) -> tuple[float, str | None]:
    if a == b:
        return 1.0, "Same timezone"
    if a.split("/", 1)[0] == b.split("/", 1)[0]:
        return 0.5, "Nearby timezone region"
    return 0.0, None


def score_partner(current: User, candidate: User) -> ScoredPartner:
    """Score a candidate using subjects, timezone, study time, and study style."""

    if current.preference is None or candidate.preference is None:
        return ScoredPartner(candidate, 0.0, [])

    reasons: list[str] = []
    subject_score, subject_reason = _subject_score(current.preference.subjects, candidate.preference.subjects)
    timezone_score, timezone_reason = _timezone_score(current.timezone, candidate.timezone)
    time_score = 1.0 if current.preference.study_time == candidate.preference.study_time else 0.0
    style_score = 1.0 if current.preference.style == candidate.preference.style else 0.5 if "mix" in {
        current.preference.style.value,
        candidate.preference.style.value,
    } else 0.0

    if subject_reason:
        reasons.append(subject_reason)
    if timezone_reason:
        reasons.append(timezone_reason)
    if time_score:
        reasons.append(f"Both prefer {current.preference.study_time.value} study sessions")
    if style_score == 1.0:
        reasons.append(f"Matching {current.preference.style.value} study style")
    elif style_score == 0.5:
        reasons.append("Compatible mixed study style")

    score = (subject_score * 0.5) + (timezone_score * 0.2) + (time_score * 0.15) + (style_score * 0.15)
    return ScoredPartner(candidate, round(score, 4), reasons or ["Good complementary accountability partner"])


async def build_suggestions(db: AsyncSession, user: User, limit: int = 10) -> list[tuple[PartnerMatch, User, list[str]]]:
    """Create or reuse pending partner matches ranked by smart compatibility score."""

    user = await db.scalar(
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.preference))
    ) or user
    if user.preference is None:
        return []

    candidates = (
        await db.scalars(
            select(User)
            .where(User.id != user.id)
            .options(selectinload(User.preference))
            .limit(100)
        )
    ).all()

    scored = sorted(
        (score_partner(user, candidate) for candidate in candidates if candidate.preference is not None),
        key=lambda item: item.score,
        reverse=True,
    )

    suggestions: list[tuple[PartnerMatch, User, list[str]]] = []
    for item in scored:
        if item.score <= 0:
            continue
        existing = await db.scalar(
            select(PartnerMatch).where(
                or_(
                    and_(PartnerMatch.user_a_id == user.id, PartnerMatch.user_b_id == item.user.id),
                    and_(PartnerMatch.user_a_id == item.user.id, PartnerMatch.user_b_id == user.id),
                )
            )
        )
        match = existing or PartnerMatch(
            user_a_id=user.id,
            user_b_id=item.user.id,
            match_score=item.score,
            status=MatchStatus.pending,
        )
        if existing is None:
            db.add(match)
            await db.flush()
        else:
            match.match_score = item.score
        suggestions.append((match, item.user, item.reasons))
        if len(suggestions) >= limit:
            break

    await db.commit()
    return suggestions


async def accept_match(db: AsyncSession, match_id: UUID, user_id: UUID) -> PartnerMatch | None:
    match = await db.scalar(
        select(PartnerMatch).where(
            PartnerMatch.id == match_id,
            or_(PartnerMatch.user_a_id == user_id, PartnerMatch.user_b_id == user_id),
        )
    )
    if match is None:
        return None
    match.status = MatchStatus.accepted
    await db.commit()
    await db.refresh(match)
    return match
