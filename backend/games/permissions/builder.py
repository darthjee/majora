"""Builds a full permissions.json response body from a page-level YAML config."""

from .page_config_store import PagePermissionConfigStore
from .resource_resolver import ResourcePermissionsResolver


class PermissionsBuilder:
    """Build the merged `{response_key: bool}` hash for a `permissions.json` endpoint.

    Loads `page_key`'s page config (`resource -> {action: response_key}`), resolves every
    resource entry through `ResourcePermissionsResolver`, and merges the results into the
    single hash the calling serializer returns as its entire response body.
    """

    def __init__(self, page_key, user=None, game=None, pc=None, roles=None):
        """Store the request context and the page config key selecting which YAML to load."""
        self._page_key = page_key
        self._user = user
        self._game = game
        self._pc = pc
        self._roles = roles

    def build(self):
        """Return the merged `{response_key: bool}` hash for every resource in the page config."""
        result = {}
        for resource, action_map in PagePermissionConfigStore.get(self._page_key).items():
            result.update(self._resolve_resource(resource, action_map))
        return result

    def _resolve_resource(self, resource, action_map):
        """Resolve a single page-config resource entry via `ResourcePermissionsResolver`."""
        return ResourcePermissionsResolver(
            resource, action_map, user=self._user, game=self._game, pc=self._pc,
            roles=self._roles,
        ).resolve()
