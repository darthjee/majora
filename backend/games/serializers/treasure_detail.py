"""Treasure detail serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure
from games.serializers.game_treasure_fields import GameTreasureFieldsMixin


class TreasureDetailSerializer(GameTreasureFieldsMixin, serializers.ModelSerializer):
    """Serializer for treasure detail view."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)
    game_slug = serializers.CharField(source='game.game_slug', default=None, read_only=True)

    class Meta:
        """Metadata for the TreasureDetailSerializer."""

        model = Treasure
        fields = [
            'id', 'name', 'value', 'photo_path', 'game_slug', 'available_units', 'max_units',
        ]
