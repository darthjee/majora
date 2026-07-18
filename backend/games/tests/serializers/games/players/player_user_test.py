"""Tests for the PlayerUserSerializer."""

from django.test import TestCase

from games.serializers.games.players.player_user import PlayerUserSerializer
from games.tests.factories import UserFactory, UserProfileFactory


class TestPlayerUserSerializer(TestCase):
    """Tests for the PlayerUserSerializer."""

    def test_serializes_display_name(self):
        """Test that display_name is sourced from the user's profile."""
        user = UserFactory(username='bob')
        UserProfileFactory(user=user, display_name='Bobby')
        data = PlayerUserSerializer(user).data
        assert data['display_name'] == 'Bobby'

    def test_serializes_photo_url_as_none_without_email(self):
        """Test that photo_url is None when the user has no email set."""
        user = UserFactory(username='bob')
        data = PlayerUserSerializer(user).data
        assert data['photo_url'] is None

    def test_serializes_photo_url_from_gravatar_when_email_set(self):
        """Test that photo_url is built from the user's Gravatar email hash."""
        user = UserFactory(username='bob', email='bob@example.com')
        data = PlayerUserSerializer(user).data
        assert data['photo_url'] is not None

    def test_get_or_creates_profile_when_missing(self):
        """Test that a missing UserProfile is created on the fly."""
        user = UserFactory(username='bob')
        data = PlayerUserSerializer(user).data
        assert 'display_name' in data
