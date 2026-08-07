"""Staff user update serializer for the games app."""

from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers


class StaffUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates to a user's name and email by staff."""

    name = serializers.CharField(
        source='username', required=False, max_length=150,
        validators=[UnicodeUsernameValidator()],
    )

    class Meta:
        """Metadata for the StaffUserUpdateSerializer."""

        model = User
        fields = ['name', 'email']
        extra_kwargs = {'email': {'required': False}}

    def validate_name(self, value):
        """Reject a name already used by a different user."""
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError('name already exists')
        return value

    def validate_email(self, value):
        """Reject an email already used by a different user."""
        if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError('email already exists')
        return value
