"""Game access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class GameAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a game access response."""

    def _get_can_edit(self, game):
        """Return whether the requesting user may edit the game."""
        if game is None:
            return False
        return game.can_be_edited_by(self._user())

    def _game_for_dm(self, game):
        """Return the game itself, the relevant game for DM resolution."""
        return game
