"""CharacterTreasure serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterTreasure
from games.serializers.games.treasures.game_treasure_fields import (
    resolve_treasure_hidden,
    resolve_treasure_value,
)
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterTreasureSerializer(serializers.ModelSerializer):
    """Serializer for a character's treasure assignment."""

    treasure_id = serializers.IntegerField(source='treasure.id', read_only=True)
    name = serializers.CharField(source='treasure.name', read_only=True)
    value = serializers.SerializerMethodField()
    photo_path = serializers.CharField(source='treasure.photo.path', default=None, read_only=True)

    def get_value(self, character_treasure):
        """Return the held treasure's value in the context game, falling back to its default."""
        return resolve_treasure_value(self.context, character_treasure.treasure)

    class Meta:
        """Metadata for the CharacterTreasureSerializer."""

        model = CharacterTreasure
        fields = ['id', 'treasure_id', 'name', 'quantity', 'value', 'photo_path']


class CharacterTreasureAllSerializer(HiddenFieldMixin, CharacterTreasureSerializer):
    """Serializer for a character's treasure assignment, including hidden treasures (DM-only).

    Used only by `GET /games/:slug/npcs/:id/treasures/all.json` — adds `hidden` on top of
    everything `CharacterTreasureSerializer` already exposes; the regular, player-facing
    treasures list keeps omitting it entirely.
    """

    def resolve_hidden(self, character_treasure):
        """Return whether the held treasure is hidden in the context game."""
        return resolve_treasure_hidden(self.context, character_treasure.treasure)

    class Meta(CharacterTreasureSerializer.Meta):
        """Metadata for the CharacterTreasureAllSerializer."""

        fields = CharacterTreasureSerializer.Meta.fields + ['hidden']
