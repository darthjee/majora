"""Add npc field to Character model."""

from django.db import migrations, models


class Migration(migrations.Migration):
    """Add npc BooleanField to Character and backfill from player_id."""

    dependencies = [
        ('games', '0007_game_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='npc',
            field=models.BooleanField(default=True),
        ),
        migrations.RunSQL(
            sql='UPDATE games_character SET npc = FALSE WHERE player_id IS NOT NULL',
            reverse_sql='UPDATE games_character SET npc = TRUE',
        ),
    ]
