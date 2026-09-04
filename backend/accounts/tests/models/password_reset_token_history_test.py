"""Tests for PasswordResetToken's history tracking excluding the raw token."""

from django.test import TestCase

from accounts.models import PasswordResetToken
from games.tests.factories import UserFactory


class TestPasswordResetTokenHistory(TestCase):
    """Tests for the `history` HistoricalRecords manager on PasswordResetToken."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created tokens."""
        cls.user = UserFactory(username='carol', password='secret-password')

    def test_historical_model_has_no_token_field(self):
        """Test that the historical model does not expose a `token` field."""
        field_names = {field.name for field in PasswordResetToken.history.model._meta.fields}
        assert 'token' not in field_names

    def test_creating_a_token_does_not_persist_it_in_history(self):
        """Test that creating a token never writes the raw token into a history record."""
        token = PasswordResetToken.objects.create(user=self.user, token='top-secret-token')
        record = token.history.first()
        assert not hasattr(record, 'token')

    def test_updating_a_token_does_not_persist_it_in_history(self):
        """Test that updating a token never writes the raw token into a history record."""
        token = PasswordResetToken.objects.create(user=self.user, token='another-secret-token')
        token.consume(password='new-secret-password')
        records = token.history.all()
        assert records.count() == 2
        for record in records:
            assert not hasattr(record, 'token')
