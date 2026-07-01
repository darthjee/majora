"""Tests for the UserProfile model."""

import pytest
from django.contrib.auth.models import User

from games.models import UserProfile


@pytest.mark.django_db
class TestUserProfile:

    """Tests for the UserProfile model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = User.objects.create_user(username='alice', password='secret-password')

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
