"""Game session list serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionListSerializer(serializers.ModelSerializer):

    """Serializer for game session list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')

    class Meta:
        model = GameSession
        fields = ['id', 'title', 'date', 'game_slug']
