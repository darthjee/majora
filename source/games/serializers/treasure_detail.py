"""Treasure detail serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureDetailSerializer(serializers.ModelSerializer):

    """Serializer for treasure detail view."""

    class Meta:
        model = Treasure
        fields = ['id', 'name', 'value']
