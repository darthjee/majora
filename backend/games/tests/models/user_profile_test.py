"""Tests for the UserProfile model."""

import hashlib

from django.test import TestCase

from games.models import UserProfile
from games.tests.factories import UserFactory


class TestUserProfile(TestCase):
    """Tests for the UserProfile model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_default_favorite_language(self):
        """Test that a new profile defaults to English."""
        profile = UserProfile.objects.create(user=self.user)
        assert profile.favorite_language == 'en'

    def test_favorite_language_can_be_updated(self):
        """Test that the favorite language can be changed and persisted."""
        profile = UserProfile.objects.create(user=self.user)
        profile.favorite_language = 'pt-BR'
        profile.save()

        profile.refresh_from_db()
        assert profile.favorite_language == 'pt-BR'

    def test_user_profile_str(self):
        """Test string representation of a user profile."""
        profile = UserProfile(user=self.user)
        assert str(profile) == 'UserProfile(user=alice)'


class TestUserProfileEmailHash(TestCase):
    """Tests for UserProfile.email_hash computation on save."""

    def test_email_hash_is_none_when_user_has_no_email(self):
        """Test that email_hash stays null when the user has no email."""
        user = UserFactory(username='bob', password='secret-password', email='')
        profile = UserProfile.objects.create(user=user)
        assert profile.email_hash is None

    def test_email_hash_is_computed_from_trimmed_lowercased_email(self):
        """Test that email_hash is the sha256 hex digest of the trimmed/lowercased email."""
        user = UserFactory(
            username='carol', password='secret-password', email=' Carol@Example.com '
        )
        profile = UserProfile.objects.create(user=user)
        expected = hashlib.sha256(b'carol@example.com').hexdigest()
        assert profile.email_hash == expected

    def test_email_hash_is_refreshed_when_email_changes(self):
        """Test that saving the profile again recomputes email_hash from the new email."""
        user = UserFactory(
            username='dave', password='secret-password', email='dave@example.com'
        )
        profile = UserProfile.objects.create(user=user)

        user.email = 'dave-new@example.com'
        user.save()
        profile.save()

        expected = hashlib.sha256(b'dave-new@example.com').hexdigest()
        assert profile.email_hash == expected
