"""Player-facing create serializer for the reduced NPC creation endpoint."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class NpcPlayerCreateSerializer(serializers.ModelSerializer):
    """Validate the narrow player-facing NPC creation payload, writing only its curated fields.

    Deliberately narrower than `CharacterCreateSerializer`: this only ever maps `name`, `role`,
    `public_description`, `public_allegiance`, `public_slain`, and `links` — `money`,
    `private_description`, `private_allegiance`, and `hidden` stay `npcs/full.json`-only, and are
    not declared here at all, so a player payload can never write them regardless of what keys it
    sends.
    """

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the NpcPlayerCreateSerializer."""

        model = Character
        fields = [
            'name', 'role', 'public_description', 'public_allegiance', 'public_slain', 'links',
        ]
        extra_kwargs = {
            'name': {'required': True},
            'role': {'required': False},
            'public_description': {'required': False},
            'public_allegiance': {'required': False},
            'public_slain': {'required': False},
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
