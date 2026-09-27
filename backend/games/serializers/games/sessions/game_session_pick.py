"""Game session pick serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionPickSerializer(serializers.ModelSerializer):
    """Serializer for session search results, exposing `name` for the resource picker."""

    name = serializers.CharField(source='title', read_only=True)

    class Meta:
        """Metadata for the GameSessionPickSerializer."""

        model = GameSession
        fields = ['id', 'name', 'title', 'date']
