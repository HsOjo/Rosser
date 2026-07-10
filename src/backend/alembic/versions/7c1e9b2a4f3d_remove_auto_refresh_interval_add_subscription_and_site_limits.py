"""remove_auto_refresh_interval_add_subscription_and_site_limits

Revision ID: 7c1e9b2a4f3d
Revises: 4ef7cf61fa7e
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c1e9b2a4f3d'
down_revision: Union[str, Sequence[str], None] = '4ef7cf61fa7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add site-level concurrency limit, default 4
    op.add_column('site', sa.Column('concurrency_limit', sa.Integer(), server_default='4', nullable=False))
    # Add subscription-level refresh interval, default 60 minutes
    op.add_column('subscription', sa.Column('refresh_interval', sa.Integer(), server_default='60', nullable=False))
    # Remove global auto_refresh_interval setting
    with op.batch_alter_table('settings') as batch_op:
        batch_op.drop_column('auto_refresh_interval')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('settings') as batch_op:
        batch_op.add_column(sa.Column('auto_refresh_interval', sa.Integer(), nullable=True))
    op.drop_column('subscription', 'refresh_interval')
    op.drop_column('site', 'concurrency_limit')
