"""Tests for the StaffUserListSerializer."""

from django.test import TestCase

from games.serializers import StaffUserListSerializer
from games.tests.factories import UserFactory


class TestStaffUserListSerializer(TestCase):
    """Tests for the StaffUserListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = StaffUserListSerializer(self.user).data
        assert data['id'] == self.user.id

    def test_serializes_name_from_username(self):
        """Test that the name field is sourced from username."""
        data = StaffUserListSerializer(self.user).data
        assert data['name'] == 'alice'

    def test_serializes_email(self):
        """Test that the email field is serialized."""
        data = StaffUserListSerializer(self.user).data
        assert data['email'] == 'alice@example.com'

    def test_only_exposes_expected_fields(self):
        """Test that only id, name, and email are exposed."""
        data = StaffUserListSerializer(self.user).data
        assert set(data.keys()) == {'id', 'name', 'email'}
