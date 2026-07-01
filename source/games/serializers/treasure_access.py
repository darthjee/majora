"""Treasure access serializer for the games app."""

from rest_framework import serializers


class TreasureAccessSerializer(serializers.Serializer):

    """Serializes access context fields for a treasure access response."""

    @property
    def data(self):
        """Return serialized data, supporting None as a valid treasure instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def to_representation(self, treasure):
        """Build the access response dict for the given treasure (may be None)."""
        return {'can_edit': self._get_can_edit(treasure)}

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None

    def _get_can_edit(self, treasure):
        """Return whether the requesting user may edit the treasure."""
        if treasure is None:
            return False
        return treasure.can_be_edited_by(self._user())
