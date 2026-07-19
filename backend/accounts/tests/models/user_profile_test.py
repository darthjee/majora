"""Tests for the UserProfile model."""

import hashlib

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from accounts.models import UserProfile
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

    def test_display_name_defaults_to_none(self):
        """Test that a new profile has no display_name set by default."""
        profile = UserProfile.objects.create(user=self.user)
        assert profile.display_name is None

    def test_display_name_can_be_set_and_persisted(self):
        """Test that display_name can be set and persisted."""
        profile = UserProfile.objects.create(user=self.user, display_name='Alice Display')
        profile.refresh_from_db()
        assert profile.display_name == 'Alice Display'

    def test_display_name_must_be_unique(self):
        """Test that two profiles cannot share the same display_name."""
        UserProfile.objects.create(user=self.user, display_name='Shared Name')
        other_user = UserFactory(username='eve', password='secret-password')

        with transaction.atomic():
            with pytest.raises(IntegrityError):
                UserProfile.objects.create(user=other_user, display_name='Shared Name')


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
