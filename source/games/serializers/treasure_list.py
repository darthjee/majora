"""Treasure list serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureListSerializer(serializers.ModelSerializer):
    """Serializer for treasure list items."""

    class Meta:
        model = Treasure
        fields = ['id', 'name', 'value']
