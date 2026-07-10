"""Base access serializer for the games app."""

from rest_framework import serializers


class BaseAccessSerializer(serializers.Serializer):
    """Shared access-context serialization logic for access-check endpoints."""

    @property
    def data(self):
        """Return serialized data, supporting None as a valid instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def to_representation(self, obj):
        """Build the access response dict for the given object (may be None)."""
        return {
            'can_edit': self._get_can_edit(obj),
            'username': self._get_username(),
            'is_superuser': self._get_is_superuser(),
            'is_staff': self._get_is_staff(),
            'is_dm': self._get_is_dm(obj),
            'is_owner': self._get_is_owner(obj),
        }

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None

    def _is_authenticated(self):
        """Return True if the requesting user is authenticated."""
        user = self._user()
        return bool(user and user.is_authenticated)

    def _get_username(self):
        """Return the requesting user's username, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        return self._user().username

    def _get_is_superuser(self):
        """Return whether the requesting user is a superuser, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        return self._user().is_superuser

    def _get_is_staff(self):
        """Return whether the requesting user is staff, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        return self._user().is_staff

    def _get_is_dm(self, obj):
        """Return whether the requesting user is a DM of the relevant game."""
        if not self._is_authenticated():
            return None
        game = self._game_for_dm(obj)
        user = self._user()
        return game.game_masters.filter(user=user).exists() if game else False

    def _game_for_dm(self, obj):
        """Return the game relevant to DM resolution for obj; None unless a subclass overrides."""
        return None

    def _get_is_owner(self, obj):
        """Return whether the requesting user owns obj; False by default (no owner concept)."""
        return False

    def _get_can_edit(self, obj):
        """Return whether the requesting user may edit obj; subclasses must implement this."""
        raise NotImplementedError
