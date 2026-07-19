"""Tests for the 0062 data migration backfilling display_name for all existing users."""

import importlib

from django.test import TestCase

from accounts.models import UserProfile
from games.tests.factories import UserFactory, UserProfileFactory
from games.tests.migration_state import historical_apps

_migration = importlib.import_module('games.migrations.0062_backfill_userprofile_display_name')


class TestUserProfileDisplayNameBackfill(TestCase):
    """Tests for the display_name backfill performed by the 0062 data migration."""

    @classmethod
    def setUpClass(cls):
        """Resolve the historical `apps` registry, as of this migration, once per class."""
        super().setUpClass()
        cls.apps = historical_apps('games', '0062_backfill_userprofile_display_name')

    def test_backfill_sets_display_name_to_username_for_user_without_profile(self):
        """Test that the backfill creates a profile with display_name=username when missing."""
        user = UserFactory(username='alice', password='secret-password')
        UserProfile.objects.filter(user=user).delete()

        _migration._backfill_display_name(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.display_name == 'alice'

    def test_backfill_leaves_existing_display_name_untouched(self):
        """Test that the backfill does not overwrite an already-set display_name."""
        user = UserFactory(username='bob', password='secret-password')
        UserProfileFactory(user=user, display_name='custom-name')

        _migration._backfill_display_name(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.display_name == 'custom-name'

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        user = UserFactory(username='carol', password='secret-password')
        profile = UserProfileFactory(user=user, display_name='carol')

        _migration._noop_reverse(self.apps, None)

        profile.refresh_from_db()
        assert profile.display_name == 'carol'
