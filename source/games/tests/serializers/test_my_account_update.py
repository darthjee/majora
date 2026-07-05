"""Tests for the MyAccountUpdateSerializer."""

import pytest
from django.contrib.auth.models import User

from games.serializers import MyAccountUpdateSerializer


@pytest.mark.django_db
class TestMyAccountUpdateSerializer:
    """Tests for MyAccountUpdateSerializer."""

    def setup_method(self):
        """Set up a user instance for testing."""
        self.user = User.objects.create_user(
            username='alice', password='secret-password', email='alice@example.com'
        )

    def test_valid_name_and_email_update(self):
        """Test that a valid name/email update is accepted."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'bob', 'email': 'bob@example.com'}
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == 'bob'
        assert user.email == 'bob@example.com'

    def test_name_is_required(self):
        """Test that name is required."""
        serializer = MyAccountUpdateSerializer(self.user, data={'email': 'alice@example.com'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_email_is_required(self):
        """Test that email is required."""
        serializer = MyAccountUpdateSerializer(self.user, data={'name': 'alice'})
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_rejects_name_used_by_another_user(self):
        """Test that a name already used by a different user is rejected."""
        User.objects.create_user(username='bob', password='secret-password')
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'bob', 'email': 'alice@example.com'}
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_allows_keeping_own_name(self):
        """Test that a user's own current name does not trigger a uniqueness error."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'email': 'alice@example.com'}
        )
        assert serializer.is_valid()

    def test_rejects_email_used_by_another_user(self):
        """Test that an email already used by a different user is rejected."""
        User.objects.create_user(
            username='bob', password='secret-password', email='bob@example.com'
        )
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'email': 'bob@example.com'}
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_allows_keeping_own_email(self):
        """Test that a user's own current email does not trigger a uniqueness error."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'email': 'alice@example.com'}
        )
        assert serializer.is_valid()

    def test_rejects_name_longer_than_150_characters(self):
        """Test that a name over 150 characters is rejected instead of hitting the database."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'a' * 151, 'email': 'alice@example.com'}
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_rejects_name_with_invalid_characters(self):
        """Test that a name with characters outside the username charset is rejected."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'invalid name!', 'email': 'alice@example.com'}
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_matching_password_and_confirmation_changes_password(self):
        """Test that a matching password/password_confirmation pair changes the password."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'email': 'alice@example.com',
                'password': 'new-secret-password', 'password_confirmation': 'new-secret-password',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password('new-secret-password')

    def test_blank_password_and_confirmation_keeps_password_unchanged(self):
        """Test that leaving both password fields blank keeps the current password."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'email': 'alice@example.com',
                'password': '', 'password_confirmation': '',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password('secret-password')

    def test_missing_password_fields_keeps_password_unchanged(self):
        """Test that omitting both password fields entirely keeps the current password."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'email': 'alice@example.com'}
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password('secret-password')

    def test_password_without_confirmation_is_invalid(self):
        """Test that setting only password without a confirmation fails validation."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'email': 'alice@example.com',
                'password': 'new-secret-password',
            },
        )
        assert not serializer.is_valid()
        assert 'password_confirmation' in serializer.errors

    def test_confirmation_without_password_is_invalid(self):
        """Test that setting only the confirmation without a password fails validation."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'email': 'alice@example.com',
                'password_confirmation': 'new-secret-password',
            },
        )
        assert not serializer.is_valid()
        assert 'password_confirmation' in serializer.errors

    def test_mismatched_password_and_confirmation_is_invalid(self):
        """Test that a mismatched password/password_confirmation pair fails validation."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'email': 'alice@example.com',
                'password': 'new-secret-password', 'password_confirmation': 'other-password',
            },
        )
        assert not serializer.is_valid()
        assert 'password_confirmation' in serializer.errors
