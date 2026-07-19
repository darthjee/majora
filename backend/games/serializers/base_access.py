"""Base access serializer for the games app."""

from rest_framework import serializers

from games.serializers._request_context_mixin import RequestContextSerializerMixin


class BaseAccessSerializer(RequestContextSerializerMixin, serializers.Serializer):
    """Shared access-context serialization logic for access-check endpoints."""

    def to_representation(self, obj):
        """Build the access response dict for the given object (may be None)."""
        return {
            'username': self._get_username(),
            'is_superuser': self._get_is_superuser(),
            'is_staff': self._get_is_staff(),
            'is_dm': self._get_is_dm(obj),
            'is_player': self._get_is_player(obj),
            'is_owner': self._get_is_owner(obj),
        }

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
        return game.has_player(user, is_dm=True) if game else False

    def _game_for_dm(self, obj):
        """Return the game relevant to DM resolution for obj; None unless a subclass overrides."""
        return None

    def _get_is_player(self, obj):
        """Return whether the requesting user is a player of the relevant game.

        Unlike is_dm, this stays False (never null) when no game is resolved at all
        (base default / non-overriding subclasses, e.g. TreasureAccessSerializer) — only
        subclasses that resolve a real game follow the null-when-unauthenticated rule.
        """
        game = self._game_for_player(obj)
        if game is None:
            return False
        if not self._is_authenticated():
            return None
        user = self._user()
        return game.has_player(user)

    def _game_for_player(self, obj):
        """Return the game relevant to player resolution for obj; None unless overridden."""
        return None

    def _get_is_owner(self, obj):
        """Return whether the requesting user owns obj; False by default (no owner concept)."""
        return False
