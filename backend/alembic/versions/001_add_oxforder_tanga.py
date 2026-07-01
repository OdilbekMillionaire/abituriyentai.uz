"""add oxforder_tanga column to users

Revision ID: 001_add_oxforder_tanga
Revises:
Create Date: 2026-03-28

"""
from alembic import op
import sqlalchemy as sa

revision = "001_add_oxforder_tanga"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("oxforder_tanga", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("users", "oxforder_tanga")
