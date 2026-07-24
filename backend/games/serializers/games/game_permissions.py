"""Game permissions serializer for the games app."""

from games.permissions import GameDocumentCreatePermission, GameItemCreatePermission
from games.serializers.base_permissions import BasePermissionsSerializer


class GamePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit/can_create_item/can_create_document permissions for a game."""

    def to_representation(self, obj):
        """Build the permissions response dict, adding can_create_item/can_create_document."""
        data = super().to_representation(obj)
        data['can_create_item'] = self._get_can_create_item(obj)
        data['can_create_document'] = self._get_can_create_document(obj)
        return data

    def _get_can_edit(self, game):
        """Return whether the requester (real or role-simulated) may edit the game."""
        if game is None:
            return False
        roles = self._roles()
        if roles is not None:
            return game.can_be_edited_by_roles(roles['is_superuser'], roles['is_dm'])
        return game.can_be_edited_by(self._user())

    def _get_can_create_item(self, game):
        """Return whether the requester (real or role-simulated) may create an item for game."""
        if game is None:
            return False
        roles = self._roles()
        if roles is not None:
            return GameItemCreatePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_staff'],
            )
        return GameItemCreatePermission.is_allowed(self._user(), game)

    def _get_can_create_document(self, game):
        """Return whether the requester (real or role-simulated) may create a document."""
        if game is None:
            return False
        roles = self._roles()
        if roles is not None:
            return GameDocumentCreatePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_staff'],
            )
        return GameDocumentCreatePermission.is_allowed(self._user(), game)
