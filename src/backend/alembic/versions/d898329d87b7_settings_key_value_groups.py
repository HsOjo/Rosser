"""settings key value groups

Revision ID: d898329d87b7
Revises: 504d8f7ccf7b
Create Date: 2026-07-09 20:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd898329d87b7'
down_revision: Union[str, Sequence[str], None] = '504d8f7ccf7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert single-row settings to key-value groups stored as JSON."""
    op.rename_table('settings', 'settings_old')

    op.create_table(
        'settings',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('create_time', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('update_time', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Migrate proxy settings into a JSON group.
    op.execute("""
        INSERT INTO settings (id, value)
        SELECT 'proxy',
               json_object(
                 'enabled', CASE WHEN proxy_enabled IN (1, '1', 'true', 'TRUE')
                                 THEN json('true') ELSE json('false') END,
                 'url', CASE WHEN proxy_url IS NULL THEN json('null')
                             ELSE json_quote(proxy_url) END
               )
        FROM settings_old
        WHERE proxy_enabled IS NOT NULL OR proxy_url IS NOT NULL
        LIMIT 1
    """)

    op.drop_table('settings_old')


def downgrade() -> None:
    """Restore the single-row settings table."""
    op.rename_table('settings', 'settings_old')

    op.create_table(
        'settings',
        sa.Column('theme', sa.String(length=32), nullable=True),
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('create_time', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('update_time', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('proxy_enabled', sa.Boolean(), nullable=True),
        sa.Column('proxy_url', sa.String(length=512), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.execute("""
        INSERT INTO settings (id, theme, proxy_enabled, proxy_url)
        SELECT
            lower(hex(randomblob(16))),
            (SELECT json_extract(value, '$.theme') FROM settings_old WHERE id = 'ui'),
            (SELECT json_extract(value, '$.enabled') FROM settings_old WHERE id = 'proxy'),
            (SELECT json_extract(value, '$.url') FROM settings_old WHERE id = 'proxy')
    """)

    op.drop_table('settings_old')
