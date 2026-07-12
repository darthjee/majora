"""Character access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class CharacterAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a character (NPC) access response."""

    def _game_for_dm(self, character):
        """Return the game from context, the relevant game for DM resolution."""
        return self.context.get('game')

    def _game_for_player(self, character):
        """Return the game from context, the relevant game for player resolution."""
        return self.context.get('game')
