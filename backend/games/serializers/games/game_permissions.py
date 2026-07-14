"""Game permissions serializer for the games app."""

from games.serializers.base_permissions import BasePermissionsSerializer


class GamePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit permission for a game permissions response."""

    def _get_can_edit(self, game):
        """Return whether the requester (real or role-simulated) may edit the game."""
        if game is None:
            return False
        roles = self._roles()
        if roles is not None:
            return game.can_be_edited_by_roles(roles['is_superuser'], roles['is_dm'])
        return game.can_be_edited_by(self._user())
