from django.db import migrations, models


def _backfill_existing_rows(GameTreasure):
    """Set value on every existing GameTreasure row to its linked Treasure's value."""
    for game_treasure in GameTreasure.objects.select_related('treasure'):
        game_treasure.value = game_treasure.treasure.value
        game_treasure.save(update_fields=['value'])


def _create_rows_for_exclusive_treasures(GameTreasure, Treasure):
    """Create a GameTreasure row for every exclusive Treasure that has none yet."""
    linked_treasure_ids = GameTreasure.objects.values_list('treasure_id', flat=True)
    exclusive_treasures = Treasure.objects.filter(game__isnull=False).exclude(
        id__in=linked_treasure_ids,
    )
    for treasure in exclusive_treasures:
        GameTreasure.objects.create(
            game_id=treasure.game_id, treasure=treasure, value=treasure.value,
        )


def _backfill_gametreasure_value(apps, schema_editor):
    """Backfill value on existing GameTreasure rows and create rows for exclusive treasures."""
    GameTreasure = apps.get_model('games', 'GameTreasure')
    Treasure = apps.get_model('games', 'Treasure')

    _backfill_existing_rows(GameTreasure)
    _create_rows_for_exclusive_treasures(GameTreasure, Treasure)


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — value removal is handled by AddField reversal."""


class Migration(migrations.Migration):
    """Migration to add GameTreasure.value (nullable) and backfill it for existing rows."""

    dependencies = [
        ('games', '0054_polloption_selected'),
    ]

    operations = [
        migrations.AddField(
            model_name='gametreasure',
            name='value',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.RunPython(_backfill_gametreasure_value, _noop_reverse),
    ]
