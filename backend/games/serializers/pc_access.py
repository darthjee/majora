"""PC access serializer for the games app."""

from games.serializers.character_access import CharacterAccessSerializer


class PcAccessSerializer(CharacterAccessSerializer):
    """Serializes access context fields for a PC access response, including is_owner."""

    def _get_is_owner(self, character):
        """Return whether the requesting user owns this PC, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        user = self._user()
        if character is None or character.player is None or character.player.user_id is None:
            return False
        return character.player.user_id == user.id
