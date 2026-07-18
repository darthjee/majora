"""Player list serializer for the games app."""

from rest_framework import serializers

from games.serializers.games.players.player_character import PlayerCharacterSerializer
from games.serializers.games.players.player_user import PlayerUserSerializer


class PlayerListSerializer(serializers.Serializer):
    """Serializer for a game's player roster, pairing each Player with its user/character."""

    id = serializers.IntegerField()
    user = serializers.SerializerMethodField()
    character = serializers.SerializerMethodField()

    def get_user(self, obj):
        """Return the player's linked user data, or None if the player has no user."""
        if obj.user_id is None:
            return None
        return PlayerUserSerializer(obj.user).data

    def get_character(self, obj):
        """Return the player's owned PC data, or None if the player owns no PC."""
        character = obj.characters.filter(npc=False).first()
        if character is None:
            return None
        return PlayerCharacterSerializer(character).data
