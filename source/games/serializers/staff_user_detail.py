"""Staff user detail serializer for the games app."""

from django.contrib.auth.models import User
from rest_framework import serializers


class StaffUserDetailSerializer(serializers.ModelSerializer):
    """Serializer for staff-facing user detail view."""

    name = serializers.CharField(source='username', max_length=150)

    class Meta:
        """Metadata for the StaffUserDetailSerializer."""

        model = User
        fields = ['id', 'name', 'email']
