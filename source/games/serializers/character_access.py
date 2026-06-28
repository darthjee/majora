"""Character access serializers for the games app."""

from rest_framework import serializers


class CharacterAccessSerializer(serializers.Serializer):
    """Serializes access context fields for a character (NPC) access response."""

    @property
    def data(self):
        """Return serialized data, supporting None as a valid character instance."""
        if not hasattr(self, '_data'):
            self._data = self.to_representation(self.instance)
        return self._data

    def to_representation(self, character):
        """Build the access response dict for the given character (may be None)."""
        return {
            'can_edit': self._get_can_edit(character),
            'username': self._get_username(),
            'is_superuser': self._get_is_superuser(),
            'is_dm': self._get_is_dm(),
        }

    def _user(self):
        """Return the requesting user from context."""
        request = self.context.get('request')
        return request.user if request else None

    def _is_authenticated(self):
        """Return True if the requesting user is authenticated."""
        user = self._user()
        return bool(user and user.is_authenticated)

    def _game(self):
        """Return the game from context."""
        return self.context.get('game')

    def _get_can_edit(self, character):
        """Return whether the requesting user may edit the character."""
        if character is None:
            return False
        return character.can_be_edited_by(self._user())

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

    def _get_is_dm(self):
        """Return whether the requesting user is a DM of the game, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        game = self._game()
        user = self._user()
        return game.game_masters.filter(user=user).exists() if game else False


class PcAccessSerializer(CharacterAccessSerializer):
    """Serializes access context fields for a PC access response, including is_owner."""

    def to_representation(self, character):
        """Extend the character access response with the is_owner field."""
        data = super().to_representation(character)
        data['is_owner'] = self._get_is_owner(character)
        return data

    def _get_is_owner(self, character):
        """Return whether the requesting user owns this PC, or None if unauthenticated."""
        if not self._is_authenticated():
            return None
        user = self._user()
        if character is None or character.player is None or character.player.user_id is None:
            return False
        return character.player.user_id == user.id
