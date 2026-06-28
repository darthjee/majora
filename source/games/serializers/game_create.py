"""Game create serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new game."""

    class Meta:
        model = Game
        fields = ['name', 'photo', 'description']
        extra_kwargs = {
            'name': {'required': True},
            'photo': {'required': False, 'allow_null': True},
            'description': {'required': False},
        }
