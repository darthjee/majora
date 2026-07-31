"""Treasure permissions serializer for the games app."""

from games.permissions import PagePermissionConfigStore, ResourcePermissionsResolver, Roles
from games.serializers.base_permissions import BasePermissionsSerializer

_PAGE_KEY = 'treasure'
_RESOURCE = 'treasure'
_GLOBAL_ACTION = 'edit'
_SCOPED_ACTION = 'edit_scoped'


class TreasurePermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit permission for a treasure permissions response.

    Unlike `CharacterPermissionsSerializer`/`GamePermissionsSerializer`, this doesn't go
    through the full `PermissionsBuilder`: exactly one of the `treasure` page config's two
    actions (`edit`/`edit_scoped`) ever applies to a given treasure, picked by whether it has
    an owning game, so this resolves that single action directly via
    `ResourcePermissionsResolver` instead of merging both (which would let whichever action
    happens to be checked last silently win).
    """

    def to_representation(self, treasure):
        """Build the permissions response dict for the single action `treasure` allows."""
        if treasure is None:
            return self._resolve(_GLOBAL_ACTION, user=None, game=None, roles=Roles.from_booleans())
        action = _GLOBAL_ACTION if treasure.game_id is None else _SCOPED_ACTION
        return self._resolve(
            action, user=self._user(), game=treasure.game, roles=self._simulated_roles(),
        )

    def _resolve(self, action, user, game, roles):
        """Resolve the single `action` entry from the page config into a `can_edit` result."""
        action_map = self._action_map(action)
        return ResourcePermissionsResolver(
            _RESOURCE, action_map, user=user, game=game, roles=roles,
        ).resolve()

    def _action_map(self, action):
        """Return the single `{action: response_key}` entry from the page config to check."""
        full_map = PagePermissionConfigStore.get(_PAGE_KEY)[_RESOURCE]
        return {action: full_map[action]}
