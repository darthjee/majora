from django.conf import settings
from django.db import migrations


def _lowercase_username_email(apps, schema_editor):
    """Lowercase every existing user's `username`/`email`, saving only rows that change.

    Confirmed (see issue #1039): no existing users differ only by case, so this can run
    unconditionally, with no collision-resolution step.
    """
    User = apps.get_model('auth', 'User')
    for user in User.objects.all():
        lowered_username = user.username.lower()
        lowered_email = user.email.lower()
        if lowered_username != user.username or lowered_email != user.email:
            user.username = lowered_username
            user.email = lowered_email
            user.save(update_fields=['username', 'email'])


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — original casing is not worth reconstructing."""


class Migration(migrations.Migration):
    """Lowercase every existing `User.username`/`User.email`, ahead of the unique constraint."""

    dependencies = [
        ('accounts', '0004_backfill_userprofile_status_approved'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(_lowercase_username_email, _noop_reverse),
    ]
