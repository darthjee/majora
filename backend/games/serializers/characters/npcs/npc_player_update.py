"""Player-facing update serializer for the narrow NPC PATCH endpoint."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class NpcPlayerUpdateSerializer(serializers.ModelSerializer):
    """Validate the narrow player-facing NPC payload, writing only its curated field set.

    Deliberately narrower than `CharacterUpdateSerializer`: this only ever maps `name`, `role`,
    `public_description` directly, the wire-level `allegiance` key onto
    `Character.public_allegiance`, the wire-level `slain` key onto `Character.public_slain`, and
    `links` — `money` and `private_description` (and the real `allegiance`/`slain`) stay
    `full.json`-only.
    """

    allegiance = serializers.ChoiceField(
        source='public_allegiance', choices=Character.ALLEGIANCE_CHOICES, required=False
    )
    slain = serializers.BooleanField(source='public_slain', required=False)
    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the NpcPlayerUpdateSerializer."""

        model = Character
        fields = ['name', 'role', 'public_description', 'allegiance', 'slain', 'links']
        extra_kwargs = {
            'name': {'required': False},
            'role': {'required': False},
            'public_description': {'required': False},
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
