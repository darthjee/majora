from django.db import migrations, models


def _backfill_existing_rows(CharacterTreasure, GameTreasure):
    """Set total_value on every existing CharacterTreasure row to quantity * effective value."""
    for character_treasure in CharacterTreasure.objects.select_related('character', 'treasure'):
        game_treasure = GameTreasure.objects.filter(
            game=character_treasure.character.game, treasure=character_treasure.treasure,
        ).first()
        value = (
            character_treasure.treasure.value if game_treasure is None else game_treasure.value
        )
        character_treasure.total_value = character_treasure.quantity * value
        character_treasure.save(update_fields=['total_value'])


def _backfill_charactertreasure_total_value(apps, schema_editor):
    """Backfill total_value on existing CharacterTreasure rows."""
    CharacterTreasure = apps.get_model('games', 'CharacterTreasure')
    GameTreasure = apps.get_model('games', 'GameTreasure')

    _backfill_existing_rows(CharacterTreasure, GameTreasure)


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — total_value removal is handled by AddField reversal."""


class Migration(migrations.Migration):
    """Migration to add CharacterTreasure.total_value and backfill it for existing rows."""

    dependencies = [
        ('games', '0056_alter_gametreasure_value_not_null'),
    ]

    operations = [
        migrations.AddField(
            model_name='charactertreasure',
            name='total_value',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(_backfill_charactertreasure_total_value, _noop_reverse),
    ]
