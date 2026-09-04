"""Tests for the StaffRecoveryTokenSerializer."""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import PasswordResetToken
from games.tests.factories import UserFactory
from staff.serializers import StaffRecoveryTokenSerializer


class TestStaffRecoveryTokenSerializer(TestCase):
    """Tests for the StaffRecoveryTokenSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created tokens."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_only_exposes_expected_fields(self):
        """Test that only the allowlisted fields are exposed, never the raw token."""
        token = PasswordResetToken.objects.create(user=self.user, token='abc123xyz789')
        data = StaffRecoveryTokenSerializer(token).data
        assert set(data.keys()) == {
            'id', 'status', 'created_at', 'expires_at', 'used_at', 'invalidated_at',
            'token_preview',
        }
        assert 'token' not in data

    def test_token_preview_is_the_last_six_characters(self):
        """Test that token_preview equals the last 6 characters of the raw token."""
        token = PasswordResetToken.objects.create(user=self.user, token='abc123xyz789')
        data = StaffRecoveryTokenSerializer(token).data
        assert data['token_preview'] == 'xyz789'

    def test_status_is_valid_when_unused_uninvalidated_and_unexpired(self):
        """Test that a fresh token reports status=valid."""
        token = PasswordResetToken.objects.create(user=self.user, token='valid-token')
        data = StaffRecoveryTokenSerializer(token).data
        assert data['status'] == 'valid'

    def test_status_is_expired_when_past_expires_at(self):
        """Test that a token past its expires_at reports status=expired."""
        token = PasswordResetToken.objects.create(user=self.user, token='expired-token')
        token.expires_at = timezone.now() - timedelta(minutes=1)
        data = StaffRecoveryTokenSerializer(token).data
        assert data['status'] == 'expired'

    def test_status_is_revoked_when_invalidated(self):
        """Test that an invalidated token reports status=revoked, even if also expired."""
        token = PasswordResetToken.objects.create(user=self.user, token='revoked-token')
        token.invalidated_at = timezone.now()
        token.expires_at = timezone.now() - timedelta(minutes=1)
        data = StaffRecoveryTokenSerializer(token).data
        assert data['status'] == 'revoked'

    def test_status_is_used_when_used_even_if_also_invalidated_and_expired(self):
        """Test the used > revoked > expired precedence: used wins over everything else."""
        token = PasswordResetToken.objects.create(user=self.user, token='used-token')
        token.used_at = timezone.now()
        token.invalidated_at = timezone.now()
        token.expires_at = timezone.now() - timedelta(minutes=1)
        data = StaffRecoveryTokenSerializer(token).data
        assert data['status'] == 'used'
