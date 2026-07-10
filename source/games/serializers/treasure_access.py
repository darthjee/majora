"""Treasure access serializer for the games app."""

from games.serializers.base_access import BaseAccessSerializer


class TreasureAccessSerializer(BaseAccessSerializer):
    """Serializes access context fields for a treasure access response."""

    def _get_can_edit(self, treasure):
        """Return whether the requesting user may edit the treasure, via any available path."""
        if treasure is None:
            return False
        user = self._user()
        if treasure.can_be_edited_by(user):
            return True
        return treasure.game_id is not None and treasure.game.can_be_edited_by(user)

    def _game_for_dm(self, treasure):
        """Return the treasure's owning game, if any, for DM resolution."""
        if treasure is None or treasure.game_id is None:
            return None
        return treasure.game
