"""Treasure permissions serializer for the games app."""

from games.serializers.base_permissions import BasePermissionsSerializer


class TreasurePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit permission for a treasure permissions response."""

    def _get_can_edit(self, treasure):
        """Return whether the requester (real or role-simulated) may edit the treasure."""
        if treasure is None:
            return False
        roles = self._roles()
        if roles is not None:
            return treasure.can_be_edited_by_roles(roles['is_superuser'], roles['is_dm'])
        return self._get_can_edit_for_real_user(treasure)

    def _get_can_edit_for_real_user(self, treasure):
        """Return whether the real requesting user may edit the treasure, via any path."""
        user = self._user()
        if treasure.can_be_edited_by(user):
            return True
        return treasure.game_id is not None and treasure.game.can_be_edited_by(user)
