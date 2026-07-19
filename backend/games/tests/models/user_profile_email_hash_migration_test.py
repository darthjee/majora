"""Tests for the 0046 data migration backfilling email_hash for all existing users."""

import hashlib
import importlib

from django.test import TestCase

from accounts.models import UserProfile
from games.tests.factories import UserFactory
from games.tests.migration_state import historical_apps

_migration = importlib.import_module('games.migrations.0046_userprofile_email_hash')


class TestUserProfileEmailHashBackfill(TestCase):
    """Tests for the email_hash backfill performed by the 0046 data migration."""

    @classmethod
    def setUpClass(cls):
        """Resolve the historical `apps` registry, as of this migration, once per class."""
        super().setUpClass()
        cls.apps = historical_apps('games', '0046_userprofile_email_hash')

    def test_backfill_computes_hash_for_user_with_email(self):
        """Test that the backfill sets email_hash for a user with an email."""
        user = UserFactory(
            username='alice', password='secret-password', email='Alice@Example.com'
        )
        UserProfile.objects.filter(user=user).delete()

        _migration._backfill_email_hash(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        expected = hashlib.sha256(b'alice@example.com').hexdigest()
        assert profile.email_hash == expected

    def test_backfill_leaves_hash_none_for_user_without_email(self):
        """Test that the backfill leaves email_hash null for a user with no email."""
        user = UserFactory(username='bob', password='secret-password', email='')
        UserProfile.objects.filter(user=user).delete()

        _migration._backfill_email_hash(self.apps, None)

        profile = UserProfile.objects.get(user=user)
        assert profile.email_hash is None

    def test_backfill_creates_profile_for_user_without_one(self):
        """Test that the backfill creates a UserProfile row when none exists yet."""
        user = UserFactory(
            username='carol', password='secret-password', email='carol@example.com'
        )
        UserProfile.objects.filter(user=user).delete()

        assert not UserProfile.objects.filter(user=user).exists()
        _migration._backfill_email_hash(self.apps, None)
        assert UserProfile.objects.filter(user=user).exists()

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        user = UserFactory(username='dave', password='secret-password', email='dave@example.com')
        profile = UserProfile.objects.create(user=user)
        original_hash = profile.email_hash

        _migration._noop_reverse(self.apps, None)

        profile.refresh_from_db()
        assert profile.email_hash == original_hash
