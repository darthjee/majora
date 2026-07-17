from django.db import migrations


def _backfill_gametreasure_hidden(apps, schema_editor):
    """Set hidden=True on every GameTreasure row whose linked Treasure is currently hidden."""
    GameTreasure = apps.get_model('games', 'GameTreasure')

    GameTreasure.objects.filter(treasure__hidden=True).update(hidden=True)


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — hidden removal is handled by Treasure's own AddField reversal."""


class Migration(migrations.Migration):
    """Migration to backfill GameTreasure.hidden from Treasure.hidden before it is dropped."""

    dependencies = [
        ('games', '0058_gametreasure_hidden'),
    ]

    operations = [
        migrations.RunPython(_backfill_gametreasure_hidden, _noop_reverse),
    ]
