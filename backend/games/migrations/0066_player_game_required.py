"""Migration to finalize the Player.game shape: required FK, no games M2M, unique (game, user)."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Make Player.game required, drop the legacy games M2M, and enforce (game, user)."""

    dependencies = [
        ('games', '0065_backfill_player_dm'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='game',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='players',
                to='games.game',
            ),
        ),
        migrations.RemoveField(
            model_name='player',
            name='games',
        ),
        migrations.AlterUniqueTogether(
            name='player',
            unique_together={('game', 'user')},
        ),
    ]
