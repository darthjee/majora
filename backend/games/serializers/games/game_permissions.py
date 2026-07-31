"""Game permissions serializer for the games app."""

from games.permissions import PermissionsBuilder
from games.serializers.base_permissions import BasePermissionsSerializer

_PAGE_KEY = 'game'


class GamePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit/can_create_item/can_create_document/can_edit_session/... flags."""

    def to_representation(self, game):
        """Build the permissions response dict via the YAML-driven `PermissionsBuilder`.

        `game` may be `None` (the entity-agnostic `/permissions/game.json` endpoint never
        looks one up) — this is harmless since `roles` is always populated from `?role=` and
        every permission check below only ever consults `roles`, never `game`/`user`.
        """
        return PermissionsBuilder(
            page_key=_PAGE_KEY, user=self._user(), game=game, roles=self._simulated_roles(),
        ).build()
