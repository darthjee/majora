"""Game session detail serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionDetailSerializer(serializers.ModelSerializer):
    """Serializer for game session detail view."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')

    class Meta:
        """Metadata for the GameSessionDetailSerializer."""

        model = GameSession
        fields = ['id', 'title', 'date', 'description', 'game_slug']
