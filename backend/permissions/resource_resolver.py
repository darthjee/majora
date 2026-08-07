"""Resolves a single page-config resource entry into response-key booleans via `UIPermission`."""

from .ui import UIPermission


class ResourcePermissionsResolver:
    """Resolve one resource's `{action: response_key}` map into `{response_key: bool}`.

    Builds a single `UIPermission` for the given user/game/pc (or an injected `roles`
    override, honoring the `?role=` simulated-preview path exactly like `UIPermission` itself),
    then checks every configured action against `resource` once.
    """

    def __init__(self, resource, action_map, user=None, game=None, pc=None, roles=None):
        """Store the resource key/action map and build the underlying `UIPermission`."""
        self._resource = resource
        self._action_map = action_map
        self._permission = UIPermission(user=user, game=game, pc=pc, roles=roles)

    def resolve(self):
        """Return `{response_key: bool}` for every `action: response_key` entry configured."""
        return {
            response_key: self._permission.allowed(self._resource, action)
            for action, response_key in self._action_map.items()
        }
