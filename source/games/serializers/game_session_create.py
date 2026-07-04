"""Game session create serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionCreateSerializer(serializers.ModelSerializer):

    """Serializer for creating a new game session."""

    class Meta:
        model = GameSession
        fields = ['title', 'date']
        extra_kwargs = {
            'title': {'required': True},
            'date': {'required': False},
        }
