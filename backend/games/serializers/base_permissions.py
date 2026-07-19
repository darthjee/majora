"""Base permissions serializer for the games app."""

from rest_framework import serializers

from games.serializers._request_context_mixin import RequestContextSerializerMixin


class BasePermissionsSerializer(RequestContextSerializerMixin, serializers.Serializer):
    """Shared can_edit-only serialization logic for permission-check endpoints.

    Complements `BaseAccessSerializer` (identity/roles only): this serializer reports only
    the `can_edit` permission, for the object and requester carried in `self.instance`/
    `self.context`. When `self.context['roles']` is set (see `views/common.py`'s
    `parse_role_booleans`), `can_edit` is computed for a simulated role instead of the real
    requester's identity.
    """

    def to_representation(self, obj):
        """Build the permissions response dict for the given object (may be None)."""
        return {'can_edit': self._get_can_edit(obj)}

    def _roles(self):
        """Return the parsed role booleans from context, or None for the real-identity path."""
        return self.context.get('roles')

    def _get_can_edit(self, obj):
        """Return whether the requester (real or role-simulated) may edit obj."""
        raise NotImplementedError
