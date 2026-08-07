"""Treasure permissions serializer for the games app."""

from games.serializers.base_permissions import BasePermissionsSerializer
from permissions import PagePermissionConfigStore, ResourcePermissionsResolver

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
        """Build the permissions response dict for the single action `treasure` allows.

        `treasure` is `None` for both entity-agnostic routes (`/permissions/treasure.json` and
        `/permissions/game_treasure.json`) — neither ever looks one up — so which of the two
        behaviorally different actions (`edit`/`edit_scoped`) applies can't be derived from a
        `game_id`, unlike the non-`None` case below. Instead it's driven by the `scoped` context
        flag those two views pass (`False`/absent for the global route, `True` for the
        game-exclusive one), mirroring `CharacterPermissionsSerializer`'s `npc` context flag.
        """
        action, game = self._action_and_game(treasure)
        return self._resolve(action, user=self._user(), game=game, roles=self._simulated_roles())

    def _action_and_game(self, treasure):
        """Return the `(action, game)` pair to resolve, from a real `treasure` or context."""
        if treasure is not None:
            game = treasure.game
            return (_GLOBAL_ACTION if game is None else _SCOPED_ACTION), game
        action = _SCOPED_ACTION if self.context.get('scoped') else _GLOBAL_ACTION
        return action, None

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
