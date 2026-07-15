import hashlib

from django.db import migrations, models


def _backfill_email_hash(apps, schema_editor):
    """Create a UserProfile (if missing) and set email_hash for every existing user."""
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('games', 'UserProfile')
    for user in User.objects.all():
        email = (user.email or '').strip().lower()
        email_hash = hashlib.sha256(email.encode()).hexdigest() if email else None
        UserProfile.objects.update_or_create(
            user=user, defaults={'email_hash': email_hash},
        )


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — email_hash removal is handled by RemoveField."""


class Migration(migrations.Migration):
    """Migration to add UserProfile.email_hash and backfill it for all existing users."""

    dependencies = [
        ('games', '0045_treasure_game_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_hash',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.RunPython(_backfill_email_hash, _noop_reverse),
    ]
