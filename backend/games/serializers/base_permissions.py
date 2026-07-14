"""Base permissions serializer for the games app."""

from rest_framework import serializers


class BasePermissionsSerializer(serializers.Serializer):
    """Shared can_edit-only serialization logic for permission-check endpoints.

    Complements `BaseAccessSerializer` (identity/roles only): this serializer reports only
    the `can_edit` permission, for the object and requester carried in `self.instance`/
    `self.context`. When `self.context['roles']` is set (see `views/common.py`'s
    `parse_role_booleans`), `can_edit` is computed for a simulated role instead of the real
    requester's identity.
    """

    @property
    def data(self):
        """Return serialized data, supporting None as a valid instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def to_representation(self, obj):
        """Build the permissions response dict for the given object (may be None)."""
        return {'can_edit': self._get_can_edit(obj)}

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None

    def _roles(self):
        """Return the parsed role booleans from context, or None for the real-identity path."""
        return self.context.get('roles')

    def _get_can_edit(self, obj):
        """Return whether the requester (real or role-simulated) may edit obj."""
        raise NotImplementedError
