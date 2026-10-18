"""Treasure full-detail serializer for the games app."""

from games.serializers.games.treasures.game_treasure_fields import resolve_treasure_hidden
from games.serializers.hidden_field_mixin import HiddenFieldMixin
from games.serializers.treasures.treasure_detail import TreasureDetailSerializer


class TreasureFullSerializer(HiddenFieldMixin, TreasureDetailSerializer):
    """Serializer for a game treasure's detail including `hidden` (DM-only).

    Used only by `GET /games/:slug/treasures/:id/full.json` — adds `hidden` on top of
    everything `TreasureDetailSerializer` exposes; the plain detail keeps omitting it.
    """

    def resolve_hidden(self, treasure):
        """Return whether `treasure` is hidden in the context game."""
        return resolve_treasure_hidden(self.context, treasure)

    class Meta(TreasureDetailSerializer.Meta):
        """Metadata for the TreasureFullSerializer."""

        fields = TreasureDetailSerializer.Meta.fields + ['hidden']
