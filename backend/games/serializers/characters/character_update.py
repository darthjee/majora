"""Character update serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the full field set a full editor (dm/admin/owner) may edit on a PC.

    Backs the `full.json` endpoint. See `CharacterRegularUpdateSerializer` for the narrower,
    player-writable field set exposed to a wider audience via the plain PC detail endpoint.
    """

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the CharacterUpdateSerializer."""

        model = Character
        fields = [
            'name',
            'role',
            'public_description',
            'private_description',
            'hidden',
            'incognito',
            'money',
            'private_allegiance',
            'public_allegiance',
            'private_slain',
            'public_slain',
            'links',
        ]
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
