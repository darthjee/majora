"""Migration to backfill one Player(is_dm=True) row per existing GameMaster row."""

from django.db import migrations


def _display_name_for(user, UserProfile):
    """Return `user`'s UserProfile.display_name, falling back to username when blank."""
    profile = UserProfile.objects.filter(user=user).first()
    if profile and profile.display_name:
        return profile.display_name
    return user.username


def _backfill_player_dm(apps, schema_editor):
    """Get-or-create a Player per GameMaster row and mark it as a DM."""
    GameMaster = apps.get_model('games', 'GameMaster')
    Player = apps.get_model('games', 'Player')
    UserProfile = apps.get_model('games', 'UserProfile')

    for game_master in GameMaster.objects.all():
        player, created = Player.objects.get_or_create(
            game=game_master.game,
            user=game_master.user,
            defaults={'name': _display_name_for(game_master.user, UserProfile)},
        )
        player.is_dm = True
        player.save(update_fields=['is_dm'])


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — DM backfill data isn't rolled back."""


class Migration(migrations.Migration):
    """Backfill one Player(is_dm=True) row for every existing GameMaster row."""

    dependencies = [
        ('games', '0064_migrate_player_games_to_game_fk'),
    ]

    operations = [
        migrations.RunPython(_backfill_player_dm, _noop_reverse),
    ]
