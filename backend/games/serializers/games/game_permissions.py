"""Game permissions serializer for the games app."""

from games.permissions import PermissionsBuilder, Roles
from games.serializers.base_permissions import BasePermissionsSerializer

_PAGE_KEY = 'game'


class GamePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit/can_create_item/can_create_document/can_edit_session/... flags."""

    def to_representation(self, game):
        """Build the permissions response dict via the YAML-driven `PermissionsBuilder`."""
        if game is None:
            return PermissionsBuilder(page_key=_PAGE_KEY, roles=Roles.from_booleans()).build()
        return PermissionsBuilder(
            page_key=_PAGE_KEY, user=self._user(), game=game, roles=self._simulated_roles(),
        ).build()
