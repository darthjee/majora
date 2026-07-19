"""My-account detail serializer for the accounts app."""

from django.contrib.auth.models import User
from rest_framework import serializers

from accounts.models import UserProfile
from games.gravatar import GravatarUrlBuilder


class MyAccountDetailSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user's own account detail."""

    name = serializers.CharField(source='username', max_length=150)
    display_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the MyAccountDetailSerializer."""

        model = User
        fields = ['name', 'display_name', 'first_name', 'last_name', 'email', 'avatar_url']

    def get_display_name(self, user):
        """Return the user's public display name."""
        return self._get_profile(user).display_name

    def get_avatar_url(self, user):
        """Return the Gravatar avatar URL built from the user's email_hash, or None."""
        return GravatarUrlBuilder.build(self._get_profile(user).email_hash)

    def _get_profile(self, user):
        """Return the user's profile, creating it if it doesn't exist yet, cached per call."""
        if not hasattr(self, '_profile'):
            self._profile, _ = UserProfile.objects.get_or_create(user=user)
        return self._profile
