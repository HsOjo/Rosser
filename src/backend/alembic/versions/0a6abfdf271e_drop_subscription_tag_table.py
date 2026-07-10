"""drop subscription_tag table

Revision ID: 0a6abfdf271e
Revises: d898329d87b7
Create Date: 2026-07-10 09:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a6abfdf271e'
down_revision: Union[str, Sequence[str], None] = 'd898329d87b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop the subscription_tag association table."""
    op.drop_table('subscription_tag')


def downgrade() -> None:
    """Recreate the subscription_tag association table."""
    op.create_table(
        'subscription_tag',
        sa.Column('subscription_id', sa.CHAR(length=36), nullable=False),
        sa.Column('tag_id', sa.CHAR(length=36), nullable=False),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscription.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tag.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('subscription_id', 'tag_id')
    )
