"""Game access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class GameAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a game access response."""

    def _game_for_dm(self, game):
        """Return the game itself, the relevant game for DM resolution."""
        return game

    def _game_for_player(self, game):
        """Return the game itself, the relevant game for player resolution."""
        return game
