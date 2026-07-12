"""Tests for the MyAccountDetailSerializer."""

from django.test import TestCase

from games.serializers import MyAccountDetailSerializer
from games.tests.factories import UserFactory


class TestMyAccountDetailSerializer(TestCase):
    """Tests for MyAccountDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user instance for testing."""
        cls.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )

    def test_serializes_name_from_username(self):
        """Test that the name field is sourced from username."""
        data = MyAccountDetailSerializer(self.user).data
        assert data['name'] == 'alice'

    def test_serializes_email(self):
        """Test that the email field is serialized."""
        data = MyAccountDetailSerializer(self.user).data
        assert data['email'] == 'alice@example.com'

    def test_only_exposes_expected_fields(self):
        """Test that only name and email are exposed."""
        data = MyAccountDetailSerializer(self.user).data
        assert set(data.keys()) == {'name', 'email'}
