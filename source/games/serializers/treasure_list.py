"""Treasure list serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureListSerializer(serializers.ModelSerializer):
    """Serializer for treasure list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)
    game_slug = serializers.CharField(source='game.game_slug', default=None, read_only=True)

    class Meta:
        """Metadata for the TreasureListSerializer."""

        model = Treasure
        fields = ['id', 'name', 'value', 'photo_path', 'game_slug']
