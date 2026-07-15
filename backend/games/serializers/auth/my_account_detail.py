"""My-account detail serializer for the games app."""

from django.contrib.auth.models import User
from rest_framework import serializers

from games.models import UserProfile
from games.settings import Settings


class MyAccountDetailSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user's own account detail."""

    name = serializers.CharField(source='username', max_length=150)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the MyAccountDetailSerializer."""

        model = User
        fields = ['name', 'email', 'avatar_url']

    def get_avatar_url(self, user):
        """Return the Gravatar avatar URL built from the user's email_hash, or None."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if not profile.email_hash:
            return None
        return f'{Settings.gravatar_base_url()}{profile.email_hash}'
