"""Game list serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameListSerializer(serializers.ModelSerializer):
    """Serializer for game list items."""

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo']
