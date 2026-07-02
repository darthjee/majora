"""Game list serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameListSerializer(serializers.ModelSerializer):

    """Serializer for game list items."""

    cover_photo_path = serializers.CharField(
        source='cover_photo.path', default=None, read_only=True
    )

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo', 'cover_photo_path']
