"""My-account update serializer for the games app."""

from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from ...account_uniqueness import display_name_taken, email_taken, username_taken
from ...models import UserProfile


class MyAccountUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user's own account update, including an optional
    password change."""

    name = serializers.CharField(
        source='username', max_length=150, validators=[UnicodeUsernameValidator()],
    )
    display_name = serializers.CharField(max_length=150)
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
        fields = [
            'name', 'display_name', 'first_name', 'last_name', 'email', 'password',
            'password_confirmation',
        ]

    def validate_name(self, value):
        """Reject a name already used by a different user."""
        if username_taken(value, exclude_pk=self.instance.pk):
            raise serializers.ValidationError('name already exists')
        return value

    def validate_display_name(self, value):
        """Reject a display_name already used by a different user's profile."""
        if display_name_taken(value, exclude_user=self.instance):
            raise serializers.ValidationError('display name already exists')
        return value

    def validate_email(self, value):
        """Reject an email already used by a different user."""
        if email_taken(value, exclude_pk=self.instance.pk):
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
        display_name = validated_data.pop('display_name')
        instance.username = validated_data['username']
        instance.first_name = validated_data.get('first_name', '')
        instance.last_name = validated_data.get('last_name', '')
        instance.email = validated_data['email']
        if password:
            instance.set_password(password)
        instance.save()
        self._update_profile(instance, display_name)
        return instance

    def _update_profile(self, instance, display_name):
        """Persist display_name and recompute email_hash on the user's profile."""
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        profile.user = instance  # avoid a stale re-fetch of the just-updated email
        profile.display_name = display_name
        profile.save()
