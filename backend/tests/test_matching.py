import uuid

from app.models.preference import Preference, StudyStyle, StudyTime
from app.models.user import User
from app.services.matching import score_partner


def _user(email: str, timezone: str, subjects: list[str], study_time: StudyTime, style: StudyStyle) -> User:
    user = User(
        id=uuid.uuid4(),
        name=email.split("@")[0],
        email=email,
        password_hash="hash",
        timezone=timezone,
    )
    user.preference = Preference(
        id=uuid.uuid4(),
        user_id=user.id,
        subjects=subjects,
        study_time=study_time,
        style=style,
    )
    return user


def test_score_partner_rewards_shared_subjects_timezone_and_style() -> None:
    current = _user("a@example.com", "Asia/Kolkata", ["DSA", "Python"], StudyTime.night, StudyStyle.group)
    candidate = _user("b@example.com", "Asia/Kolkata", ["Python", "Math"], StudyTime.night, StudyStyle.group)

    result = score_partner(current, candidate)

    assert result.score > 0.55
    assert any("python" in reason.lower() for reason in result.reasons)
    assert "Same timezone" in result.reasons


def test_score_partner_allows_mix_style_as_partial_match() -> None:
    current = _user("a@example.com", "Asia/Kolkata", ["Physics"], StudyTime.morning, StudyStyle.mix)
    candidate = _user("b@example.com", "Asia/Singapore", ["Physics"], StudyTime.evening, StudyStyle.solo)

    result = score_partner(current, candidate)

    assert result.score > 0.5
    assert any("mixed" in reason.lower() for reason in result.reasons)
