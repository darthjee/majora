"""Treasure create serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new treasure."""

    value = serializers.IntegerField(required=True, min_value=0)

    class Meta:
        """Metadata for the TreasureCreateSerializer."""

        model = Treasure
        fields = ['name', 'value', 'game_type']
        extra_kwargs = {
            'name': {'required': True},
            'game_type': {'required': False},
        }
