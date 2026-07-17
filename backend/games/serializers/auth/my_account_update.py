"""My-account update serializer for the games app."""

from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from ...models import UserProfile


class MyAccountUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user's own account update, including an optional
    password change."""

    name = serializers.CharField(
        source='username', max_length=150, validators=[UnicodeUsernameValidator()],
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_confirmation = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
    )

    class Meta:
        """Metadata for the MyAccountUpdateSerializer."""

        model = User
        fields = ['name', 'first_name', 'last_name', 'email', 'password', 'password_confirmation']

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

    def validate(self, attrs):
        """Reject a password/confirmation pair that doesn't match when either is set."""
        password = attrs.get('password') or ''
        confirmation = attrs.get('password_confirmation') or ''
        if (password or confirmation) and password != confirmation:
            raise serializers.ValidationError(
                {'password_confirmation': ['password and password_confirmation must match']}
            )
        return attrs

    def update(self, instance, validated_data):
        """Persist name/first_name/last_name/email, and the new password only when one was
        provided."""
        password = validated_data.pop('password', '') or ''
        validated_data.pop('password_confirmation', None)
        instance.username = validated_data['username']
        instance.first_name = validated_data.get('first_name', '')
        instance.last_name = validated_data.get('last_name', '')
        instance.email = validated_data['email']
        if password:
            instance.set_password(password)
        instance.save()
        self._refresh_email_hash(instance)
        return instance

    def _refresh_email_hash(self, instance):
        """Recompute the profile's email_hash to match the just-updated user email."""
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        profile.user = instance  # avoid a stale re-fetch of the just-updated email
        profile.save()
