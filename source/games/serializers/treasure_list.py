"""Treasure list serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureListSerializer(serializers.ModelSerializer):

    """Serializer for treasure list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        model = Treasure
        fields = ['id', 'name', 'value', 'photo_path']
