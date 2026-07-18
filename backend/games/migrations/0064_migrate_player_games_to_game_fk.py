"""Migration to convert legacy Player.games M2M rows into the new Player.game FK shape."""

from django.db import migrations


def _split_into_per_game_rows(player, games, Player):
    """Create one Player row per linked game (copying name/user/is_dm), then delete `player`."""
    for game in games:
        Player.objects.create(
            name=player.name,
            user=player.user,
            is_dm=player.is_dm,
            game=game,
        )
    player.delete()


def _migrate_player_games_to_game_fk(apps, schema_editor):
    """Convert each legacy Player row (games M2M) into the new per-game (game FK) shape."""
    Player = apps.get_model('games', 'Player')

    for player in Player.objects.prefetch_related('games').all():
        games = list(player.games.all())
        if len(games) == 0:
            player.delete()
        elif len(games) == 1:
            player.game = games[0]
            player.save(update_fields=['game'])
        else:
            _split_into_per_game_rows(player, games, Player)


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — the legacy per-player M2M shape isn't reconstructed."""


class Migration(migrations.Migration):
    """Migrate legacy Player.games M2M data into the new Player.game FK shape."""

    dependencies = [
        ('games', '0063_player_add_game_fk_and_is_dm'),
    ]

    operations = [
        migrations.RunPython(_migrate_player_games_to_game_fk, _noop_reverse),
    ]
