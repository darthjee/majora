from django.db import migrations


def _backfill_display_name(apps, schema_editor):
    """Set display_name = username on every UserProfile, creating profiles that don't exist yet."""
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('games', 'UserProfile')

    for user in User.objects.all():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if not profile.display_name:
            profile.display_name = user.username
            profile.save(update_fields=['display_name'])


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — display_name removal is handled by its own AddField reversal."""


class Migration(migrations.Migration):
    """Migration to backfill UserProfile.display_name from username for all existing users."""

    dependencies = [
        ('games', '0061_userprofile_display_name'),
    ]

    operations = [
        migrations.RunPython(_backfill_display_name, _noop_reverse),
    ]
