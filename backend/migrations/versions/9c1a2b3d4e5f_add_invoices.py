"""add invoices

Revision ID: 9c1a2b3d4e5f
Revises: 8bfee017ff4c
Create Date: 2026-05-18 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9c1a2b3d4e5f"
down_revision: Union[str, None] = "8bfee017ff4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


payment_status = postgresql.ENUM(
    "pending",
    "paid",
    "unpaid",
    name="payment_status",
    create_type=False,
)


def upgrade() -> None:
    payment_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=True),
        sa.Column("invoice_number", sa.String(length=80), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "payment_status",
            payment_status,
            server_default="pending",
            nullable=False,
        ),
        sa.Column("paid_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoices_company_status", "invoices", ["company_id", "payment_status"])
    op.create_index("ix_invoices_event_status", "invoices", ["event_id", "payment_status"])


def downgrade() -> None:
    op.drop_index("ix_invoices_event_status", table_name="invoices")
    op.drop_index("ix_invoices_company_status", table_name="invoices")
    op.drop_table("invoices")
    payment_status.drop(op.get_bind(), checkfirst=True)
