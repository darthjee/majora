"""Character access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class CharacterAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a character (NPC) access response."""

    def _get_can_edit(self, character):
        """Return whether the requesting user may edit the character."""
        if character is None:
            return False
        return character.can_be_edited_by(self._user())

    def _game_for_dm(self, character):
        """Return the game from context, the relevant game for DM resolution."""
        return self.context.get('game')

    def _game_for_player(self, character):
        """Return the game from context, the relevant game for player resolution."""
        return self.context.get('game')
