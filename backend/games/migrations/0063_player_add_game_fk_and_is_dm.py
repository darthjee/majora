"""Migration to add a nullable Player.game FK and Player.is_dm, keeping games M2M for now."""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Add Player.game (nullable) and Player.is_dm without touching the legacy games M2M."""

    dependencies = [
        ('games', '0062_backfill_userprofile_display_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='player',
            name='game',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='players',
                to='games.game',
            ),
        ),
        migrations.AddField(
            model_name='player',
            name='is_dm',
            field=models.BooleanField(default=False),
        ),
    ]
