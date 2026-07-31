"""Game list serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameListSerializer(serializers.ModelSerializer):
    """Serializer for game list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameListSerializer."""

        model = Game
        fields = ['name', 'game_slug', 'photo_path']
