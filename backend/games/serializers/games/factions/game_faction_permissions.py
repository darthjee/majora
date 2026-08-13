"""Game faction permissions serializer for the games app."""

from games.serializers.base_permissions import BasePermissionsSerializer
from permissions import PermissionsBuilder

_PAGE_KEY = 'game_faction'


class GameFactionPermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit flag for the entity-agnostic game faction permissions.json."""

    def to_representation(self, instance):
        """Build the permissions response dict via the YAML-driven `PermissionsBuilder`.

        `instance` is always `None` (the entity-agnostic `/permissions/game_faction.json`
        endpoint never looks one up) — harmless since `roles` is always populated from
        `?role=` and the single configured check only ever consults `roles`.
        """
        return PermissionsBuilder(
            page_key=_PAGE_KEY, user=self._user(), roles=self._simulated_roles(),
        ).build()
