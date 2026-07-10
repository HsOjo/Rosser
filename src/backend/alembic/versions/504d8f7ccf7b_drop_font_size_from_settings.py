"""drop font_size from settings

Revision ID: 504d8f7ccf7b
Revises: 7c1e9b2a4f3d
Create Date: 2026-07-09 20:12:48.909132

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '504d8f7ccf7b'
down_revision: Union[str, Sequence[str], None] = '7c1e9b2a4f3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('settings') as batch_op:
        batch_op.drop_column('font_size')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('settings') as batch_op:
        batch_op.add_column(sa.Column('font_size', sa.String(length=16), nullable=True))
