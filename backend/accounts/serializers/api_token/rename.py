"""Scoped API token rename serializer for the accounts app."""

from rest_framework import serializers

from accounts.models import ApiToken
from accounts.serializers.api_token.create import NAME_MAX_LENGTH
from accounts.serializers.api_token.strict_fields import StrictFieldsMixin


class ApiTokenRenameSerializer(StrictFieldsMixin, serializers.Serializer):
    """Validate a token rename: only `name` is editable."""

    name = serializers.CharField(max_length=NAME_MAX_LENGTH, trim_whitespace=True)

    def update(self, instance, validated_data):
        """Rename the token with a targeted update, so a concurrent revoke is not undone."""
        ApiToken.objects.filter(pk=instance.pk).update(name=validated_data['name'])
        instance.name = validated_data['name']
        return instance
