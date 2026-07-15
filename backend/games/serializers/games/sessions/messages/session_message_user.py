"""Reduced author view for a session message, for security (no email etc.)."""

from rest_framework import serializers

from games.gravatar import GravatarUrlBuilder
from games.models import UserProfile


class SessionMessageUserSerializer(serializers.Serializer):
    """Serializer exposing only a message author's name and avatar URL."""

    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_name(self, user):
        """Return the author's username."""
        return user.username

    def get_avatar_url(self, user):
        """Return the author's Gravatar avatar URL, or None if they have no email hash."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return GravatarUrlBuilder.build(profile.email_hash)
