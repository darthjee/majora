"""Game access serializer for the games app."""

from rest_framework import serializers


class GameAccessSerializer(serializers.Serializer):

    """Serializes access context fields for a game access response."""

    @property
    def data(self):
        """Return serialized data, supporting None as a valid game instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def to_representation(self, game):
        """Build the access response dict for the given game (may be None)."""
        return {
            'can_edit': self._get_can_edit(game),
            'username': self._get_username(),
            'is_superuser': self._get_is_superuser(),
            'is_dm': self._get_is_dm(game),
        }

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None

    def _is_authenticated(self):
        """Return True if the requesting user is authenticated."""
        user = self._user()
        return bool(user and user.is_authenticated)

    def _get_can_edit(self, game):
        """Return whether the requesting user may edit the game."""
        if game is None:
            return False
        return game.can_be_edited_by(self._user())

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

    def _get_is_dm(self, game):
        """Return whether the requesting user is a DM of the game, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        user = self._user()
        return game.game_masters.filter(user=user).exists() if game else False
