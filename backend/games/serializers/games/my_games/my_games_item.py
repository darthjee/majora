"""Wrapper serializer for a single item in the my-games list."""

from rest_framework import serializers

from games.serializers.games.game_list import GameListSerializer
from games.serializers.games.players.player_character import PlayerCharacterSerializer


class MyGamesItemSerializer(serializers.Serializer):
    """Serializes one `{game, role, character, conversations}` dict from `MyGamesBuilder`.

    Not backed by a model instance — wraps heterogeneous data assembled for a single game
    the requesting user belongs to, pairing the game with the user's role, owned character
    (if any), and followed-conversation counts for that game.
    """

    role = serializers.CharField()
    conversations = serializers.DictField()
    game = serializers.SerializerMethodField()
    character = serializers.SerializerMethodField()

    def get_game(self, obj):
        """Serialize the item's game with the same shape as the public games list."""
        return GameListSerializer(obj['game']).data

    def get_character(self, obj):
        """Serialize the item's character, or None for DMs / players without a PC yet."""
        character = obj['character']
        if character is None:
            return None
        return PlayerCharacterSerializer(character).data
