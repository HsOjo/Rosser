"""merge heads

Revision ID: c9b6c5eb5a58
Revises: 0a6abfdf271e, 64fa75566802
Create Date: 2026-07-18 12:53:33.890422

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9b6c5eb5a58'
down_revision: Union[str, Sequence[str], None] = ('0a6abfdf271e', '64fa75566802')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
