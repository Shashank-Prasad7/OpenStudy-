from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.match import PartnerMatch
from app.models.user import User
from app.schemas.auth import UserPublic
from app.schemas.match import MatchRead, MatchSuggestion
from app.services.matching import accept_match, build_suggestions
from app.utils import not_found

router = APIRouter(prefix="/matches", tags=["partner matching"])


@router.get("", response_model=list[MatchSuggestion])
async def get_matches(
    limit: int = Query(default=10, ge=1, le=25),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MatchSuggestion]:
    """Return smart accountability partner suggestions."""

    suggestions = await build_suggestions(db, current_user, limit=limit)
    return [
        MatchSuggestion(
            match=MatchRead.model_validate(match),
            partner=UserPublic.model_validate(partner),
            reasons=reasons,
        )
        for match, partner, reasons in suggestions
    ]


@router.post("/{match_id}/accept", response_model=MatchRead)
async def accept_partner_match(
    match_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PartnerMatch:
    """Accept a pending accountability partner match."""

    match = await accept_match(db, match_id, current_user.id)
    if match is None:
        raise not_found("Match")
    return match
