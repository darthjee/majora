"""Treasure list serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure
from games.serializers.games.treasures.game_treasure_fields import (
    GameTreasureFieldsMixin,
    resolve_treasure_hidden,
)
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class TreasureListSerializer(GameTreasureFieldsMixin, serializers.ModelSerializer):
    """Serializer for treasure list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)
    game_slug = serializers.CharField(source='game.game_slug', default=None, read_only=True)

    class Meta:
        """Metadata for the TreasureListSerializer."""

        model = Treasure
        fields = [
            'id', 'name', 'value', 'game_type', 'photo_path', 'game_slug', 'available_units',
            'max_units',
        ]


class TreasureAllListSerializer(HiddenFieldMixin, TreasureListSerializer):
    """Serializer for treasure list items when hidden treasures are included (DM-only).

    Used only by `GET /games/:slug/treasures/all.json` — adds `hidden` on top of everything
    `TreasureListSerializer` already exposes; the regular, player-facing treasure list keeps
    omitting it entirely.
    """

    def resolve_hidden(self, treasure):
        """Return whether `treasure` is hidden in the context game."""
        return resolve_treasure_hidden(self.context, treasure)

    class Meta(TreasureListSerializer.Meta):
        """Metadata for the TreasureAllListSerializer."""

        fields = TreasureListSerializer.Meta.fields + ['hidden']
