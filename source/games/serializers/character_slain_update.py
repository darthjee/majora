"""Serializer validating the body of the NPC slain-toggle endpoint."""

from rest_framework import serializers


class CharacterSlainUpdateSerializer(serializers.Serializer):
    """Validates the `slain`/`public_slain` booleans sent to the slain-toggle endpoint."""

    slain = serializers.BooleanField(required=False)
    public_slain = serializers.BooleanField(required=False)

    def validate(self, attrs):
        """Ensure at least one of `slain`/`public_slain` is present in the payload."""
        if 'slain' not in attrs and 'public_slain' not in attrs:
            raise serializers.ValidationError(
                'At least one of "slain" or "public_slain" is required.'
            )
        return attrs
