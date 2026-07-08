"""Character create serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new NPC character (name required, no player field)."""

    class Meta:
        """Metadata for the CharacterCreateSerializer."""

        model = Character
        fields = [
            'name',
            'role',
            'public_description',
            'private_description',
            'hidden',
            'money',
            'allegiance',
            'public_allegiance',
        ]
        extra_kwargs = {
            'name': {'required': True},
            'role': {'required': False},
            'public_description': {'required': False},
            'private_description': {'required': False},
            'hidden': {'required': False},
            'money': {'required': False},
            'allegiance': {'required': False},
            'public_allegiance': {'required': False},
        }
