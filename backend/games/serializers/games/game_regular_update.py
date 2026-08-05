"""Game regular (staff/player-writable) update serializer for the games app."""

from rest_framework import serializers

from games.models import Game
from games.serializers.characters.character_link_write import validate_links_count
from games.serializers.games.game_link_write import GameLinksSync, GameLinkWriteSerializer


class GameRegularUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the narrow, staff/player-writable game update endpoint (issue #891).

    Unlike `GameUpdateSerializer`, `name` is not declared here — a regular-tier request that
    includes it is silently dropped, matching `CharacterRegularUpdateSerializer`'s handling of
    its own restricted-only fields.
    """

    links = GameLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the GameRegularUpdateSerializer."""

        model = Game
        fields = ['description', 'links']
        extra_kwargs = {
            field: {'required': False} for field in fields if field != 'links'
        }

    def validate_links(self, value):
        """Reject a `links` payload with more entries than `GameLinksSync` should batch."""
        return validate_links_count(value)

    def update(self, instance, validated_data):
        """Update the game's scalar fields, then sync its `links` per entry."""
        links = validated_data.pop('links', [])
        instance = super().update(instance, validated_data)
        GameLinksSync(instance, links).apply()
        return instance
