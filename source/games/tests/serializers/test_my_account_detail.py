"""Tests for the MyAccountDetailSerializer."""

import pytest

from games.serializers import MyAccountDetailSerializer
from games.tests.factories import UserFactory


@pytest.mark.django_db
class TestMyAccountDetailSerializer:
    """Tests for MyAccountDetailSerializer."""

    def setup_method(self):
        """Set up a user instance for testing."""
        self.user = UserFactory(
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
