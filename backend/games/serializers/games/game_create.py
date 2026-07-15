"""Game create serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new game."""

    class Meta:
        """Metadata for the GameCreateSerializer."""

        model = Game
        fields = ['name', 'description', 'game_type']
        extra_kwargs = {
            'name': {'required': True},
            'description': {'required': False},
            'game_type': {'required': False},
        }
