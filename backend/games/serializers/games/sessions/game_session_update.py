"""Game session update serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates to a game session."""

    class Meta:
        """Metadata for the GameSessionUpdateSerializer."""

        model = GameSession
        fields = ['title', 'date', 'description']
        extra_kwargs = {field: {'required': False} for field in fields}
