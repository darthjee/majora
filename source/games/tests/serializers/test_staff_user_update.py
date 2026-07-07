"""Tests for the StaffUserUpdateSerializer."""

import pytest

from games.serializers import StaffUserUpdateSerializer
from games.tests.factories import UserFactory


@pytest.mark.django_db
class TestStaffUserUpdateSerializer:
    """Tests for StaffUserUpdateSerializer."""

    def setup_method(self):
        """Set up a user instance for testing."""
        self.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = StaffUserUpdateSerializer(self.user, data={'name': 'bob'}, partial=True)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == 'bob'

    def test_valid_partial_email_update(self):
        """Test that a partial update with only email is valid."""
        serializer = StaffUserUpdateSerializer(
            self.user, data={'email': 'bob@example.com'}, partial=True
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'bob@example.com'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = StaffUserUpdateSerializer(self.user, data={}, partial=True)
        assert serializer.is_valid()

    def test_id_is_not_included(self):
        """Test that id is not a field in the serializer and cannot be changed."""
        original_id = self.user.id
        serializer = StaffUserUpdateSerializer(
            self.user, data={'name': 'bob', 'id': original_id + 1000}, partial=True
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == 'bob'
        assert user.id == original_id

    def test_rejects_name_used_by_another_user(self):
        """Test that a name already used by a different user is rejected."""
        UserFactory(username='bob', password='secret-password')
        serializer = StaffUserUpdateSerializer(self.user, data={'name': 'bob'}, partial=True)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_allows_keeping_own_name(self):
        """Test that a user's own current name does not trigger a uniqueness error."""
        serializer = StaffUserUpdateSerializer(self.user, data={'name': 'alice'}, partial=True)
        assert serializer.is_valid()

    def test_rejects_email_used_by_another_user(self):
        """Test that an email already used by a different user is rejected."""
        UserFactory(
            username='bob', password='secret-password', email='bob@example.com'
        )
        serializer = StaffUserUpdateSerializer(
            self.user, data={'email': 'bob@example.com'}, partial=True
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_allows_keeping_own_email(self):
        """Test that a user's own current email does not trigger a uniqueness error."""
        serializer = StaffUserUpdateSerializer(
            self.user, data={'email': 'alice@example.com'}, partial=True
        )
        assert serializer.is_valid()

    def test_rejects_name_longer_than_150_characters(self):
        """Test that a name over 150 characters is rejected instead of hitting the database."""
        serializer = StaffUserUpdateSerializer(
            self.user, data={'name': 'a' * 151}, partial=True
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_rejects_name_with_invalid_characters(self):
        """Test that a name with characters outside the username charset is rejected."""
        serializer = StaffUserUpdateSerializer(
            self.user, data={'name': 'invalid name!'}, partial=True
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
