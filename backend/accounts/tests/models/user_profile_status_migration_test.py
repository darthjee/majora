"""Tests for the 0004 data migration backfilling status=approved for all existing users."""

import importlib

from django.test import TestCase

from accounts.models import UserProfile
from games.tests.factories import UserFactory, UserProfileFactory
from games.tests.migration_state import historical_apps

_migration = importlib.import_module(
    'accounts.migrations.0004_backfill_userprofile_status_approved'
)


class TestUserProfileStatusBackfill(TestCase):
    """Tests for the status backfill performed by the 0004 data migration."""

    @classmethod
    def setUpClass(cls):
        """Resolve the historical `apps` registry, as of this migration, once per class."""
        super().setUpClass()
        cls.apps = historical_apps(
            'accounts', '0004_backfill_userprofile_status_approved',
        )

    def test_backfill_approves_a_pending_profile(self):
        """Test that the backfill flips an existing pending profile to approved."""
        user = UserFactory(username='alice', password='secret-password')
        UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)

        _migration._backfill_approved_status(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.status == UserProfile.STATUS_APPROVED

    def test_backfill_approves_every_pre_existing_profile_unconditionally(self):
        """Test that the backfill approves any pre-existing profile, whatever its status.

        This mirrors the migration's real-world guarantee: at the point this migration
        actually runs in production, no profile can be anything other than the field's
        `pending` default yet (nothing had ever set `denied`/`approved` before this data
        migration exists) — so it deliberately doesn't special-case any status.
        """
        user = UserFactory(username='bob', password='secret-password')
        UserProfileFactory(user=user, status=UserProfile.STATUS_DENIED)

        _migration._backfill_approved_status(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.status == UserProfile.STATUS_APPROVED

    def test_backfill_creates_an_approved_profile_for_user_without_one(self):
        """Test that the backfill creates status=approved for a user with no profile yet."""
        user = UserFactory(username='carol', password='secret-password')
        UserProfile.objects.filter(user=user).delete()

        assert not UserProfile.objects.filter(user=user).exists()
        _migration._backfill_approved_status(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.status == UserProfile.STATUS_APPROVED

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        user = UserFactory(username='dave', password='secret-password')
        profile = user.profile
        profile.status = UserProfile.STATUS_DENIED
        profile.save(update_fields=['status'])

        _migration._noop_reverse(self.apps, None)

        profile.refresh_from_db()
        assert profile.status == UserProfile.STATUS_DENIED
