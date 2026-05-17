"""add owner_user_id to companies

Revision ID: 8f4f76a642f4
Revises: 0002_add_company_notes
Create Date: 2026-05-17 16:27:51.929524

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8f4f76a642f4'
down_revision: Union[str, None] = '0002_add_company_notes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'companies',
        sa.Column('owner_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('companies', 'owner_user_id')
