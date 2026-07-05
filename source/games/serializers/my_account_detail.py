"""My-account detail serializer for the games app."""

from django.contrib.auth.models import User
from rest_framework import serializers


class MyAccountDetailSerializer(serializers.ModelSerializer):

    """Serializer for the authenticated user's own account detail."""

    name = serializers.CharField(source='username', max_length=150)

    class Meta:
        model = User
        fields = ['name', 'email']
