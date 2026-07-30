"""UI (page/component) access permission checks."""

from .base import BasePermission
from .config_store import PermissionConfigStore


class UIPermission(BasePermission):
    """Expose one boolean check per UI permission (usually tied to a page or component).

    The only one of the two permission classes that accepts a pre-resolved `roles` object at
    construction outside of tests — this is how the `?role=` simulated-preview path works
    (see `*PermissionsSerializer`).
    """

    def allowed(self, resource, action):
        """Return whether the caller may access `action` of `resource`'s UI."""
        config = PermissionConfigStore.get(resource, 'ui')
        return self._allowed(config.get(action))
