"""Repoint `games` at the `uploads` app now that `Upload` moved there.

State-only -- the underlying `games_upload` table is left untouched (still named
`games_upload`, now owned by `uploads.Upload` via its `db_table` Meta override); this
migration only removes the model from `games`'s own migration state, after
`uploads`'s own `0001_initial` migration has already added it to `uploads`'s state
(same add-then-remove ordering as the `domains`/`games` app-split precedent).
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('games', '0090_move_domain_models_to_domains_app'),
        ('uploads', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(
                    name='Upload',
                ),
            ],
            database_operations=[],
        ),
    ]
