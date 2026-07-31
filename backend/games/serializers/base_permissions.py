"""Base permissions serializer for the games app."""

from rest_framework import serializers

from games.permissions import Roles
from games.serializers._request_context_mixin import RequestContextSerializerMixin


class BasePermissionsSerializer(RequestContextSerializerMixin, serializers.Serializer):
    """Shared context helpers for permission-check endpoint serializers.

    Complements `BaseAccessSerializer` (identity/roles only): each subclass builds its own
    `permissions.json` response body (via `PermissionsBuilder`/`ResourcePermissionsResolver`),
    for the object and requester carried in `self.instance`/`self.context`. This base class
    only holds the `?role=` simulated-preview plumbing shared by every subclass — see
    `views/common.py`'s `parse_role_booleans`.
    """

    def _roles(self):
        """Return the parsed role booleans from context, or None for the real-identity path."""
        return self.context.get('roles')

    def _simulated_roles(self):
        """Build a role-simulated `Roles` from context, or None for the real-identity path."""
        roles = self._roles()
        if roles is None:
            return None
        return Roles.from_booleans(
            is_superuser=roles['is_superuser'], is_dm=roles['is_dm'],
            is_owner=roles['is_owner'], is_staff=roles['is_staff'],
            is_player=roles['is_player'],
        )
