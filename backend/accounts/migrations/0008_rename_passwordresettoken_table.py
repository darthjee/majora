"""Perform the physical rename of the password reset token table.

The games -> accounts move for `PasswordResetToken` was previously applied to
migration state only: `games/0071` dropped it from `games` state and
`accounts/0001_initial` recreated it in `accounts` state while pinning
`options={'db_table': 'games_passwordresettoken'}` so the physical table stayed
put. This migration finally renames the physical table
`games_passwordresettoken` -> `accounts_passwordresettoken` and supersedes the
`db_table = 'games_passwordresettoken'` override frozen in
`accounts/0001_initial` (which must not be edited).

`RENAME TABLE` is an atomic, metadata-only operation and is fully reversible via
`reverse_sql`; every row, column and value is preserved, so in-flight recovery
links keep resolving.
"""

from django.db import migrations


class Migration(migrations.Migration):
    """Rename `games_passwordresettoken` to `accounts_passwordresettoken`."""

    dependencies = [
        ('accounts', '0007_cachetoken'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterModelTable('passwordresettoken', table=None),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "RENAME TABLE games_passwordresettoken "
                        "TO accounts_passwordresettoken;"
                    ),
                    reverse_sql=(
                        "RENAME TABLE accounts_passwordresettoken "
                        "TO games_passwordresettoken;"
                    ),
                ),
            ],
        ),
    ]
