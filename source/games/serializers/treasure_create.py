"""Treasure create serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new treasure."""

    class Meta:
        model = Treasure
        fields = ['name', 'value']
        extra_kwargs = {
            'name': {'required': True},
            'value': {'required': True},
        }
