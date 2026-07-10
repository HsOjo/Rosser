"""remove ui settings

Revision ID: 64fa75566802
Revises: d898329d87b7
Create Date: 2026-07-09 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '64fa75566802'
down_revision: Union[str, Sequence[str], None] = 'd898329d87b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove the UI settings group; UI state is now stored on the frontend."""
    op.execute("DELETE FROM settings WHERE id = 'ui'")


def downgrade() -> None:
    """No-op: UI settings are not restored to the backend."""
    pass
