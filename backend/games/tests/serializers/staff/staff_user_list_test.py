"""Tests for the StaffUserListSerializer."""

from django.test import TestCase

from accounts.models import UserProfile
from games.serializers import StaffUserListSerializer
from games.tests.factories import UserFactory, UserProfileFactory


class TestStaffUserListSerializer(TestCase):
    """Tests for the StaffUserListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )
        UserProfileFactory(
            user=cls.user, display_name='Alice Display', status=UserProfile.STATUS_PENDING,
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

    def test_serializes_status_from_profile(self):
        """Test that the status field is sourced from the user's profile."""
        data = StaffUserListSerializer(self.user).data
        assert data['status'] == UserProfile.STATUS_PENDING

    def test_serializes_display_name_from_profile(self):
        """Test that the display_name field is sourced from the user's profile."""
        data = StaffUserListSerializer(self.user).data
        assert data['display_name'] == 'Alice Display'

    def test_only_exposes_expected_fields(self):
        """Test that only id, name, email, status, and display_name are exposed."""
        data = StaffUserListSerializer(self.user).data
        assert set(data.keys()) == {'id', 'name', 'email', 'status', 'display_name'}
