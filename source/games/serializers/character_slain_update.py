"""Serializer validating the body of the NPC slain-toggle endpoint."""

from rest_framework import serializers


class CharacterSlainUpdateSerializer(serializers.Serializer):
    """Validates the `slain` boolean sent to the slain-toggle endpoint."""

    slain = serializers.BooleanField(required=True)
