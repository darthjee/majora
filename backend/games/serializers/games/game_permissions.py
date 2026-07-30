"""Game permissions serializer for the games app."""

from games.permissions import Roles, UIPermission
from games.serializers.base_permissions import BasePermissionsSerializer


class GamePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit/can_create_item/can_create_document/can_edit_session flags."""

    def to_representation(self, obj):
        """Build the permissions dict: can_create_item/can_create_document/can_edit_session."""
        data = super().to_representation(obj)
        data['can_create_item'] = self._get_can_create_item(obj)
        data['can_create_document'] = self._get_can_create_document(obj)
        data['can_edit_session'] = self._get_can_edit_session(obj)
        data['can_create_npc'] = self._get_can_create_npc(obj)
        return data

    def _ui_permission(self, game):
        """Build a `UIPermission` for `game`, honoring the `?role=` simulated path."""
        roles = self._roles()
        if roles is not None:
            simulated_roles = Roles.from_booleans(
                is_superuser=roles['is_superuser'], is_dm=roles['is_dm'],
                is_owner=roles['is_owner'], is_staff=roles['is_staff'],
                is_player=roles['is_player'],
            )
            return UIPermission(roles=simulated_roles)
        return UIPermission(user=self._user(), game=game)

    def _get_can_edit(self, game):
        """Return whether the requester (real or role-simulated) may edit the game."""
        if game is None:
            return False
        return self._ui_permission(game).allowed('game', 'edit')

    def _get_can_create_item(self, game):
        """Return whether the requester (real or role-simulated) may create an item for game."""
        if game is None:
            return False
        return self._ui_permission(game).allowed('game', 'create_item')

    def _get_can_create_document(self, game):
        """Return whether the requester (real or role-simulated) may create a document."""
        if game is None:
            return False
        return self._ui_permission(game).allowed('game', 'create_document')

    def _get_can_edit_session(self, game):
        """Return whether the requester (real or role-simulated) may create/edit a session."""
        if game is None:
            return False
        return self._ui_permission(game).allowed('game', 'edit_session')

    def _get_can_create_npc(self, game):
        """Return whether the requester (real or role-simulated) may create a player-facing NPC."""
        if game is None:
            return False
        return self._ui_permission(game).allowed('game', 'create_npc')
