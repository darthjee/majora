"""Character regular (player-writable) update serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class CharacterRegularUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the narrow, player-writable PC update endpoint (issue #865)."""

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the CharacterRegularUpdateSerializer."""

        model = Character
        fields = ['name', 'role', 'public_description', 'money', 'links']
        extra_kwargs = {
            field: {'required': False} for field in fields if field != 'links'
        }

    def validate_links(self, value):
        """Reject a `links` payload with more entries than `CharacterLinksSync` should batch."""
        return validate_links_count(value)

    def update(self, instance, validated_data):
        """Update the character's scalar fields, then sync its `links` per entry."""
        links = validated_data.pop('links', [])
        instance = super().update(instance, validated_data)
        CharacterLinksSync(instance, links).apply()
        return instance
