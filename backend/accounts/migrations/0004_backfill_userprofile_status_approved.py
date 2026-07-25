from django.db import migrations


def _backfill_approved_status(apps, schema_editor):
    """Approve every existing user's profile, creating profiles that don't exist yet.

    Ensures nobody who could already use the site before this migration (including
    staff/admins and accounts created outside the register flow, e.g. `createsuperuser`)
    is locked out by the new `status` field's `pending` default.
    """
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('accounts', 'UserProfile')

    for user in User.objects.all():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.status != 'approved':
            profile.status = 'approved'
            profile.save(update_fields=['status'])


def _noop_reverse(apps, schema_editor):
    """No-op reverse migration — status removal is handled by its own AddField reversal."""


class Migration(migrations.Migration):
    """Backfill `UserProfile.status` to `approved` for every user existing at migration time."""

    dependencies = [
        ('accounts', '0003_userprofile_status'),
    ]

    operations = [
        migrations.RunPython(_backfill_approved_status, _noop_reverse),
    ]
