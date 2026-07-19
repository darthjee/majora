"""Shared request-context serializer mixin for the games app."""


class RequestContextSerializerMixin:
    """Shared memoized `data` property and `_user()` accessor for context-driven serializers."""

    @property
    def data(self):
        """Return serialized data, supporting None as a valid instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None
