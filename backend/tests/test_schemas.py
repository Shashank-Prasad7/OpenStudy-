from uuid import uuid4

from pydantic import ValidationError

from app.schemas.goal import SessionNoteCreate


def test_session_note_collapses_multiline_text() -> None:
    payload = SessionNoteCreate(session_id=uuid4(), note_text="Read chapter 1\nSolved 10 problems")

    assert payload.note_text == "Read chapter 1 Solved 10 problems"


def test_session_note_rejects_blank_text() -> None:
    try:
        SessionNoteCreate(session_id=uuid4(), note_text="   \n  ")
    except ValidationError:
        return

    raise AssertionError("Expected ValidationError for blank note")
