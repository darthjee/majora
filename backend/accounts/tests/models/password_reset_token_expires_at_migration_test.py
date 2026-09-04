"""Tests for the 0009 data migration backfilling expires_at for all pre-existing tokens."""

import importlib
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import PasswordResetToken
from games.settings import Settings
from games.tests.factories import UserFactory
from games.tests.migration_state import historical_apps

_migration = importlib.import_module(
    'accounts.migrations.0009_passwordresettoken_expires_at_invalidated_at'
)


class TestPasswordResetTokenExpiresAtBackfill(TestCase):
    """Tests for the expires_at backfill performed by the 0009 data migration."""

    @classmethod
    def setUpClass(cls):
        """Resolve the historical `apps` registry, as of this migration, once per class."""
        super().setUpClass()
        cls.apps = historical_apps(
            'accounts', '0009_passwordresettoken_expires_at_invalidated_at',
        )

    def setUp(self):
        """Set up a user to own created tokens."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.expiration = timedelta(minutes=Settings.password_reset_token_expiration_minutes())

    def test_backfill_sets_expires_at_from_created_at_plus_configured_minutes(self):
        """Test that a partially-elapsed token's expires_at is created_at plus the window."""
        token = PasswordResetToken.objects.create(user=self.user, token='partially-elapsed')
        created_at = timezone.now() - timedelta(minutes=1)
        PasswordResetToken.objects.filter(pk=token.pk).update(created_at=created_at)

        _migration._backfill_expires_at(self.apps, None)

        token.refresh_from_db()
        assert token.expires_at == created_at + self.expiration

    def test_backfill_leaves_already_expired_tokens_expired(self):
        """Test that an already-expired token's backfilled expires_at stays in the past."""
        token = PasswordResetToken.objects.create(user=self.user, token='already-expired')
        created_at = timezone.now() - self.expiration - timedelta(minutes=10)
        PasswordResetToken.objects.filter(pk=token.pk).update(created_at=created_at)

        _migration._backfill_expires_at(self.apps, None)

        token.refresh_from_db()
        assert token.expires_at == created_at + self.expiration
        assert token.expires_at < timezone.now()

    def test_backfill_leaves_invalidated_at_null(self):
        """Test that the backfill never touches invalidated_at."""
        token = PasswordResetToken.objects.create(user=self.user, token='untouched-invalidation')

        _migration._backfill_expires_at(self.apps, None)

        token.refresh_from_db()
        assert token.invalidated_at is None

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        token = PasswordResetToken.objects.create(user=self.user, token='reverse-noop')
        original_expires_at = token.expires_at

        _migration._noop_reverse(self.apps, None)

        token.refresh_from_db()
        assert token.expires_at == original_expires_at
