"""Serializer exposing a Player's linked User's public display name and avatar."""

from rest_framework import serializers

from accounts.models import UserProfile
from games.gravatar import GravatarUrlBuilder


class PlayerUserSerializer(serializers.Serializer):
    """Serializer exposing a player's linked user's display name and photo URL."""

    display_name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    def get_display_name(self, user):
        """Return the user's public display name."""
        return self._get_profile(user).display_name

    def get_photo_url(self, user):
        """Return the user's Gravatar photo URL, or None if they have no email hash."""
        return GravatarUrlBuilder.build(self._get_profile(user).email_hash)

    def _get_profile(self, user):
        """Return the given user's profile, creating it if missing, caching per call."""
        if not hasattr(self, '_profile'):
            self._profile, _ = UserProfile.objects.get_or_create(user=user)
        return self._profile
