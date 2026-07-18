"""Migration to track Player.game and Player.is_dm on HistoricalPlayer."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Add HistoricalPlayer.game and HistoricalPlayer.is_dm, mirroring games.Player."""

    dependencies = [
        ('versioning', '0005_remove_historicaltreasure_hidden'),
        ('games', '0063_player_add_game_fk_and_is_dm'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalplayer',
            name='game',
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='+',
                to='games.game',
            ),
        ),
        migrations.AddField(
            model_name='historicalplayer',
            name='is_dm',
            field=models.BooleanField(default=False),
        ),
    ]
