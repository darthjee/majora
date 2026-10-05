"""User identity serializer shared by the staff access statistics endpoints."""

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers


class StatisticsUserIdentitySerializer(serializers.ModelSerializer):
    """Serializes a user as `{id, name, display_name, email}` for the statistics endpoints.

    `display_name` is `None` when the profile's display name is blank or the user has no
    profile, unlike `StaffUserListSerializer`.
    """

    name = serializers.CharField(source='username')
    display_name = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StatisticsUserIdentitySerializer."""

        model = User
        fields = ['id', 'name', 'display_name', 'email']

    def get_display_name(self, user):
        """Return the profile's display name, or `None` when blank or without a profile."""
        try:
            return user.profile.display_name or None
        except ObjectDoesNotExist:
            return None
