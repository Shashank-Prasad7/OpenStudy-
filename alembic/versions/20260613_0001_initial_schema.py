"""initial OpenStudy schema

Revision ID: 20260613_0001
Revises:
Create Date: 2026-06-13 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260613_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    room_visibility = sa.Enum("public", "private", name="room_visibility")
    study_time = sa.Enum("morning", "evening", "night", name="study_time")
    study_style = sa.Enum("solo", "group", "mix", name="study_style")
    pomodoro_status = sa.Enum("active", "paused", "completed", name="pomodoro_status")
    match_status = sa.Enum("pending", "accepted", "declined", name="match_status")

    bind = op.get_bind()
    room_visibility.create(bind, checkfirst=True)
    study_time.create(bind, checkfirst=True)
    study_style.create(bind, checkfirst=True)
    pomodoro_status.create(bind, checkfirst=True)
    match_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=50), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("streak_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "study_rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("subject_tags", postgresql.ARRAY(sa.String()), server_default=sa.text("'{}'::varchar[]"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visibility", room_visibility, server_default="public", nullable=False),
        sa.Column("max_members", sa.Integer(), server_default="10", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_study_rooms_created_by_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_study_rooms")),
    )
    op.create_index(op.f("ix_study_rooms_created_by"), "study_rooms", ["created_by"], unique=False)

    op.create_table(
        "room_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["study_rooms.id"], name=op.f("fk_room_members_room_id_study_rooms"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_room_members_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_room_members")),
        sa.UniqueConstraint("room_id", "user_id", name="uq_room_members_room_user"),
    )
    op.create_index(op.f("ix_room_members_room_id"), "room_members", ["room_id"], unique=False)
    op.create_index(op.f("ix_room_members_user_id"), "room_members", ["user_id"], unique=False)

    op.create_table(
        "goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_goals_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_goals")),
    )
    op.create_index(op.f("ix_goals_user_id"), "goals", ["user_id"], unique=False)

    op.create_table(
        "preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subjects", postgresql.ARRAY(sa.VARCHAR()), server_default=sa.text("'{}'::varchar[]"), nullable=False),
        sa.Column("study_time", study_time, nullable=False),
        sa.Column("style", study_style, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_preferences_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_preferences")),
        sa.UniqueConstraint("user_id", name="uq_preferences_user_id"),
    )
    op.create_index(op.f("ix_preferences_user_id"), "preferences", ["user_id"], unique=False)

    op.create_table(
        "pomodoro_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("duration_mins", sa.Integer(), nullable=False),
        sa.Column("status", pomodoro_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["room_id"], ["study_rooms.id"], name=op.f("fk_pomodoro_sessions_room_id_study_rooms"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pomodoro_sessions")),
    )
    op.create_index(op.f("ix_pomodoro_sessions_room_id"), "pomodoro_sessions", ["room_id"], unique=False)

    op.create_table(
        "session_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["pomodoro_sessions.id"], name=op.f("fk_session_notes_session_id_pomodoro_sessions"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_session_notes_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_session_notes")),
    )
    op.create_index(op.f("ix_session_notes_session_id"), "session_notes", ["session_id"], unique=False)
    op.create_index(op.f("ix_session_notes_user_id"), "session_notes", ["user_id"], unique=False)

    op.create_table(
        "partner_matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_a_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_b_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("status", match_status, server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.CheckConstraint("match_score >= 0 and match_score <= 1", name="ck_partner_matches_score_range"),
        sa.CheckConstraint("user_a_id <> user_b_id", name="ck_partner_matches_distinct_users"),
        sa.ForeignKeyConstraint(["user_a_id"], ["users.id"], name=op.f("fk_partner_matches_user_a_id_users"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_b_id"], ["users.id"], name=op.f("fk_partner_matches_user_b_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_partner_matches")),
    )
    op.create_index(op.f("ix_partner_matches_user_a_id"), "partner_matches", ["user_a_id"], unique=False)
    op.create_index(op.f("ix_partner_matches_user_b_id"), "partner_matches", ["user_b_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_partner_matches_user_b_id"), table_name="partner_matches")
    op.drop_index(op.f("ix_partner_matches_user_a_id"), table_name="partner_matches")
    op.drop_table("partner_matches")
    op.drop_index(op.f("ix_session_notes_user_id"), table_name="session_notes")
    op.drop_index(op.f("ix_session_notes_session_id"), table_name="session_notes")
    op.drop_table("session_notes")
    op.drop_index(op.f("ix_pomodoro_sessions_room_id"), table_name="pomodoro_sessions")
    op.drop_table("pomodoro_sessions")
    op.drop_index(op.f("ix_preferences_user_id"), table_name="preferences")
    op.drop_table("preferences")
    op.drop_index(op.f("ix_goals_user_id"), table_name="goals")
    op.drop_table("goals")
    op.drop_index(op.f("ix_room_members_user_id"), table_name="room_members")
    op.drop_index(op.f("ix_room_members_room_id"), table_name="room_members")
    op.drop_table("room_members")
    op.drop_index(op.f("ix_study_rooms_created_by"), table_name="study_rooms")
    op.drop_table("study_rooms")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    sa.Enum(name="match_status").drop(bind, checkfirst=True)
    sa.Enum(name="pomodoro_status").drop(bind, checkfirst=True)
    sa.Enum(name="study_style").drop(bind, checkfirst=True)
    sa.Enum(name="study_time").drop(bind, checkfirst=True)
    sa.Enum(name="room_visibility").drop(bind, checkfirst=True)
