# Backend Plan: Add User Avatar

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces `avatar_url` on `MyAccountDetailSerializer` — see [plan.md](plan.md)'s "Shared
  contracts" for the exact field shape and `Settings.gravatar_base_url()` details.
- No dependency on frontend or translator work — this half can be implemented and tested
  standalone.

## Implementation Steps

### Step 1 — Add `email_hash` to `UserProfile`

In `backend/games/models/user_profile.py`, add:

```python
email_hash = models.CharField(max_length=64, null=True, blank=True)
```

Override `save()` to keep it in sync with `self.user.email` on every save:

```python
import hashlib

def save(self, *args, **kwargs):
    """Save the profile, recomputing email_hash from the linked user's email."""
    self.email_hash = self._compute_email_hash()
    super().save(*args, **kwargs)

def _compute_email_hash(self):
    email = (self.user.email or '').strip().lower()
    if not email:
        return None
    return hashlib.sha256(email.encode()).hexdigest()
```

This covers profile creation (e.g. the existing lazy `UserProfile.objects.get_or_create(user=user)`
call in `backend/games/views/auth/status.py`) for free — a freshly created profile gets the
correct hash from whatever email the user already has at that point.

### Step 2 — Refresh the hash when the account email is updated

`User.email` lives on Django's built-in `auth.User`, not on `UserProfile`, so
`UserProfile.save()` is not invoked automatically when the email changes via
`MyAccountUpdateSerializer.update()` (`backend/games/serializers/auth/my_account_update.py`).
Update that method to explicitly refresh the profile after saving the user:

```python
def update(self, instance, validated_data):
    """Persist name/email, and the new password only when one was provided."""
    password = validated_data.pop('password', '') or ''
    validated_data.pop('password_confirmation', None)
    instance.username = validated_data['username']
    instance.email = validated_data['email']
    if password:
        instance.set_password(password)
    instance.save()
    self._refresh_email_hash(instance)
    return instance

def _refresh_email_hash(self, instance):
    profile, _ = UserProfile.objects.get_or_create(user=instance)
    profile.user = instance  # avoid a stale re-fetch of the just-updated email
    profile.save()
```

(Import `UserProfile` from `...models` at the top of the file, matching the existing
import style in `backend/games/views/auth/status.py`.)

No change is needed at registration (`backend/games/views/auth/_shared.py:_create_registered_user`):
no `UserProfile` row exists yet for a newly registered user, so it gets created — with the
correct hash — the first time something calls `UserProfile.objects.get_or_create(user=user)`,
the same lazy-creation behavior `favorite_language` already relies on.

### Step 3 — Data migration: backfill `email_hash` for all existing users

Create `backend/games/migrations/0045_userprofile_email_hash.py` (check the latest number
under `backend/games/migrations/` right before implementing in case another migration has
landed since this plan was written) with an `AddField` plus a `RunPython` backfill that
covers **every** existing `User`, not just users who already have a `UserProfile` row — the
issue explicitly asks for the migration to run for all current users:

```python
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


class Migration(migrations.Migration):
    """Migration to add UserProfile.email_hash and backfill it for all existing users."""

    dependencies = [
        ('games', '<latest_migration>'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_hash',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.RunPython(_backfill_email_hash, migrations.RunPython.noop),
    ]
```

Note `UserProfile.objects.update_or_create(...)` here uses the *historical* migration
model (`apps.get_model`), so it does **not** go through the `save()` override from Step 1 —
the hash must be computed inline in the migration itself, as above.

### Step 4 — `GRAVATAR_BASE_URL` setting

In `backend/games/settings.py`, add a new static method following the existing
`cache_control_anonymous_max_age()` pattern (string setting, no int casting needed):

```python
@staticmethod
def gravatar_base_url():
    """Return the base URL to prefix an email hash with to build a Gravatar avatar URL."""
    return os.environ.get('MAJORA_GRAVATAR_BASE_URL', 'https://gravatar.com/avatar/')
```

### Step 5 — `avatar_url` on `MyAccountDetailSerializer`

In `backend/games/serializers/auth/my_account_detail.py`, add the `avatar_url` field
described in [plan.md](plan.md)'s "Shared contracts":

```python
from games.models import UserProfile
from games.settings import Settings

class MyAccountDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='username', max_length=150)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['name', 'email', 'avatar_url']

    def get_avatar_url(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if not profile.email_hash:
            return None
        return f'{Settings.gravatar_base_url()}{profile.email_hash}'
```

No changes needed to `backend/games/views/auth/account.py` — it already re-serializes with
`MyAccountDetailSerializer` on both `GET` and after a successful `PATCH`.

## Files to Change

- `backend/games/models/user_profile.py` — add `email_hash` field and `save()` override
- `backend/games/serializers/auth/my_account_update.py` — refresh the profile's hash after an email update
- `backend/games/serializers/auth/my_account_detail.py` — add `avatar_url` field
- `backend/games/settings.py` — add `gravatar_base_url()`
- `backend/games/migrations/0045_userprofile_email_hash.py` — new migration (add field + backfill)
- `backend/games/tests/models/user_profile_test.py` — cover `email_hash` computation on save (with/without email, changing email)
- `backend/games/tests/serializers/auth/my_account_update_test.py` — cover that updating the email refreshes `email_hash`
- `backend/games/tests/serializers/auth/my_account_detail_test.py` — cover `avatar_url` present/null
- `backend/games/tests/settings_test.py` — cover `Settings.gravatar_base_url()` default and env override, following the `TestSettingsCacheControlAnonymousMaxAge` pattern
- `backend/games/tests/models/user_profile_email_hash_migration_test.py` (new) — cover the `0045` backfill, following the `importlib.import_module(...)` pattern in `backend/games/tests/models/character/character_public_slain_migration_test.py`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- Use `UserFactory` (`backend/games/tests/factories`) for test fixtures, matching
  `user_profile_test.py`'s existing convention.
- Double-check the actual latest migration filename in `backend/games/migrations/` at
  implementation time and set `dependencies` accordingly — `0044_game_game_type.py` was
  the latest at plan-writing time, so this migration is expected to be `0045_...`, but
  another issue may land a migration first.
