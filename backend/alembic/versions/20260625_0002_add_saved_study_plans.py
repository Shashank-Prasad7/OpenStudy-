"""add saved_study_plans table

Revision ID: 20260625_0002
Revises: 20260613_0001_initial_schema
Create Date: 2026-06-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260625_0002"
down_revision = "20260613_0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_study_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("exam", sa.String(200), nullable=False),
        sa.Column("level", sa.String(80), nullable=False),
        sa.Column("hours_per_day", sa.Float, nullable=False),
        sa.Column("exam_date", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("plan_data", postgresql.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("timezone('utc', now())")),
    )


def downgrade() -> None:
    op.drop_table("saved_study_plans")
