"""Staff user list serializer for the games app."""

from django.contrib.auth.models import User
from rest_framework import serializers


class StaffUserListSerializer(serializers.ModelSerializer):

    """Serializer for staff-facing user list items."""

    name = serializers.CharField(source='username')

    class Meta:
        model = User
        fields = ['id', 'name', 'email']
