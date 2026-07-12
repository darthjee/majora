"""Treasure access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class TreasureAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a treasure access response."""

    def _game_for_dm(self, treasure):
        """Return the treasure's owning game, if any, for DM resolution."""
        if treasure is None or treasure.game_id is None:
            return None
        return treasure.game
