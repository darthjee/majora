"""Tests for the PasswordResetToken model."""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import PasswordResetToken
from games.settings import Settings
from games.tests.factories import UserFactory


class TestPasswordResetTokenIsValid(TestCase):
    """Tests for PasswordResetToken.is_valid."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created tokens."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_is_false_when_used(self):
        """Test that a used token is never valid, regardless of expiration."""
        token = PasswordResetToken.objects.create(user=self.user, token='used-token')
        token.used_at = timezone.now()
        assert token.is_valid() is False

    def test_is_false_when_invalidated(self):
        """Test that an invalidated token is never valid, regardless of expiration."""
        token = PasswordResetToken.objects.create(user=self.user, token='revoked-token')
        token.invalidated_at = timezone.now()
        assert token.is_valid() is False

    def test_is_false_when_expired(self):
        """Test that a token past its expires_at is not valid."""
        token = PasswordResetToken.objects.create(user=self.user, token='expired-token')
        token.expires_at = timezone.now() - timedelta(minutes=1)
        assert token.is_valid() is False

    def test_is_true_when_unused_uninvalidated_and_unexpired(self):
        """Test that a fresh token, untouched, is valid."""
        token = PasswordResetToken.objects.create(user=self.user, token='valid-token')
        assert token.is_valid() is True


class TestPasswordResetTokenDefaultExpiresAt(TestCase):
    """Tests for PasswordResetToken.expires_at's default callable."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created tokens."""
        cls.user = UserFactory(username='bob', password='secret-password')

    def test_defaults_to_now_plus_configured_minutes(self):
        """Test that expires_at defaults to now plus the configured expiration window.

        `created_at` (auto_now_add) and `expires_at` (the field's own `default=` callable)
        are computed from two independent `timezone.now()` calls a few microseconds apart,
        so exact equality isn't expected; a generous tolerance keeps this from being flaky
        while still catching a wrong offset.
        """
        token = PasswordResetToken.objects.create(user=self.user, token='default-expiry-token')
        expiration = timedelta(minutes=Settings.password_reset_token_expiration_minutes())
        delta = token.expires_at - (timezone.now() + expiration)
        assert abs(delta) < timedelta(seconds=5)
