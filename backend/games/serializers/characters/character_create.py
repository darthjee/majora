"""Character create serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class CharacterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new NPC character (name required, no player field)."""

    links = CharacterLinkWriteSerializer(many=True, required=False)

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
            'links',
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

    def validate_links(self, value):
        """Reject a `links` payload with more entries than `CharacterLinksSync` should batch."""
        return validate_links_count(value)

    def create(self, validated_data):
        """Create the character, then create a `CharacterLink` for each entry in `links`."""
        links = validated_data.pop('links', [])
        character = super().create(validated_data)
        CharacterLinksSync(character, links).create_all()
        return character
