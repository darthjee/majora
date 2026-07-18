"""Reduced author view for a session message, for security (no email etc.)."""

from rest_framework import serializers

from games.gravatar import GravatarUrlBuilder
from games.models import UserProfile


class SessionMessageUserSerializer(serializers.Serializer):
    """Serializer exposing only a message author's name and avatar URL."""

    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_name(self, user):
        """Return the author's public display name."""
        return self._get_profile(user).display_name

    def get_avatar_url(self, user):
        """Return the author's Gravatar avatar URL, or None if they have no email hash."""
        return GravatarUrlBuilder.build(self._get_profile(user).email_hash)

    def _get_profile(self, user):
        """Return the given user's profile, creating it if missing, caching per user id."""
        cache = self.__dict__.setdefault('_profiles_by_user_id', {})
        if user.id not in cache:
            cache[user.id], _ = UserProfile.objects.get_or_create(user=user)
        return cache[user.id]
