from django.db import migrations


def _migrate_game_domain_group_to_m2m(apps, schema_editor):
    """Copy each Game's non-null game_domain_group into the new game_domain_groups M2M."""
    Game = apps.get_model('games', 'Game')

    for game in Game.objects.exclude(game_domain_group__isnull=True):
        game.game_domain_groups.add(game.game_domain_group_id)


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — the FK column itself is restored by its own AddField reversal."""


class Migration(migrations.Migration):
    """Data migration backfilling Game.game_domain_groups from the old game_domain_group FK."""

    dependencies = [
        ('games', '0086_gamedomain_unique_domain_title_game_domain_groups'),
    ]

    operations = [
        migrations.RunPython(_migrate_game_domain_group_to_m2m, _noop_reverse),
    ]
