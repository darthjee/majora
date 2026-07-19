"""Tests for the MyAccountUpdateSerializer."""

import hashlib

from django.test import TestCase

from accounts.models import UserProfile
from accounts.serializers import MyAccountUpdateSerializer
from games.tests.factories import UserFactory, UserProfileFactory


class TestMyAccountUpdateSerializer(TestCase):
    """Tests for MyAccountUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user instance for testing."""
        cls.user = UserFactory(
            username='alice', password='secret-password', email='alice@example.com'
        )
        cls.profile = UserProfileFactory(user=cls.user, display_name='alice-display')

    def test_valid_name_and_email_update(self):
        """Test that a valid name/display_name/email update is accepted."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'bob', 'display_name': 'bob-display', 'email': 'bob@example.com',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == 'bob'
        assert user.email == 'bob@example.com'

    def test_name_is_required(self):
        """Test that name is required."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'display_name': 'alice-display', 'email': 'alice@example.com'}
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_display_name_is_required(self):
        """Test that display_name is required."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'email': 'alice@example.com'},
        )
        assert not serializer.is_valid()
        assert 'display_name' in serializer.errors

    def test_email_is_required(self):
        """Test that email is required."""
        serializer = MyAccountUpdateSerializer(
            self.user, data={'name': 'alice', 'display_name': 'alice-display'}
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_rejects_name_used_by_another_user(self):
        """Test that a name already used by a different user is rejected."""
        UserFactory(username='bob', password='secret-password')
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'bob', 'display_name': 'alice-display', 'email': 'alice@example.com',
            },
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_rejects_display_name_used_by_another_user(self):
        """Test that a display_name already used by a different user's profile is rejected."""
        other_user = UserFactory(username='bob', password='secret-password')
        UserProfileFactory(user=other_user, display_name='bob-display')
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'bob-display', 'email': 'alice@example.com',
            },
        )
        assert not serializer.is_valid()
        assert 'display_name' in serializer.errors

    def test_allows_keeping_own_display_name(self):
        """Test that a user's own current display_name does not trigger a uniqueness error."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
            },
        )
        assert serializer.is_valid()

    def test_valid_update_persists_display_name(self):
        """Test that a valid update persists the new display_name on the profile."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'new-display', 'email': 'alice@example.com',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        profile = UserProfile.objects.get(user=user)
        assert profile.display_name == 'new-display'

    def test_allows_keeping_own_name(self):
        """Test that a user's own current name does not trigger a uniqueness error."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
            },
        )
        assert serializer.is_valid()

    def test_rejects_email_used_by_another_user(self):
        """Test that an email already used by a different user is rejected."""
        UserFactory(
            username='bob', password='secret-password', email='bob@example.com'
        )
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={'name': 'alice', 'display_name': 'alice-display', 'email': 'bob@example.com'},
        )
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_allows_keeping_own_email(self):
        """Test that a user's own current email does not trigger a uniqueness error."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com'},
        )
        assert serializer.is_valid()

    def test_rejects_name_longer_than_150_characters(self):
        """Test that a name over 150 characters is rejected instead of hitting the database."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={'name': 'a' * 151, 'display_name': 'alice-display', 'email': 'alice@example.com'},
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_valid_first_and_last_name_update(self):
        """Test that a valid first_name/last_name update is accepted and persisted."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'first_name': 'Alice', 'last_name': 'Smith',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.first_name == 'Alice'
        assert user.last_name == 'Smith'

    def test_first_and_last_name_are_optional(self):
        """Test that omitting first_name/last_name is valid and saves them as ''."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com'},
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.first_name == ''
        assert user.last_name == ''

    def test_blank_first_and_last_name_are_accepted(self):
        """Test that explicit blank first_name/last_name values are valid."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'first_name': '', 'last_name': '',
            },
        )
        assert serializer.is_valid()

    def test_rejects_first_name_longer_than_150_characters(self):
        """Test that a first_name over 150 characters is rejected."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'first_name': 'a' * 151,
            },
        )
        assert not serializer.is_valid()
        assert 'first_name' in serializer.errors

    def test_rejects_last_name_longer_than_150_characters(self):
        """Test that a last_name over 150 characters is rejected."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'last_name': 'a' * 151,
            },
        )
        assert not serializer.is_valid()
        assert 'last_name' in serializer.errors

    def test_rejects_name_with_invalid_characters(self):
        """Test that a name with characters outside the username charset is rejected."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'invalid name!', 'display_name': 'alice-display',
                'email': 'alice@example.com',
            },
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_matching_password_and_confirmation_changes_password(self):
        """Test that a matching password/password_confirmation pair changes the password."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
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
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'password': '', 'password_confirmation': '',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password('secret-password')

    def test_missing_password_fields_keeps_password_unchanged(self):
        """Test that omitting both password fields entirely keeps the current password."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com'},
        )
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password('secret-password')

    def test_password_without_confirmation_is_invalid(self):
        """Test that setting only password without a confirmation fails validation."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
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
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'password_confirmation': 'new-secret-password',
            },
        )
        assert not serializer.is_valid()
        assert 'password_confirmation' in serializer.errors

    def test_updating_email_refreshes_email_hash(self):
        """Test that updating the email recomputes the profile's email_hash."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display',
                'email': 'alice-new@example.com',
            },
        )
        assert serializer.is_valid()
        user = serializer.save()

        profile = UserProfile.objects.get(user=user)
        expected = hashlib.sha256(b'alice-new@example.com').hexdigest()
        assert profile.email_hash == expected

    def test_mismatched_password_and_confirmation_is_invalid(self):
        """Test that a mismatched password/password_confirmation pair fails validation."""
        serializer = MyAccountUpdateSerializer(
            self.user,
            data={
                'name': 'alice', 'display_name': 'alice-display', 'email': 'alice@example.com',
                'password': 'new-secret-password', 'password_confirmation': 'other-password',
            },
        )
        assert not serializer.is_valid()
        assert 'password_confirmation' in serializer.errors
