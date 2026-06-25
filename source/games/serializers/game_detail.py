"""Game detail serializer for the games app."""

from rest_framework import serializers

from games.models import Game
from games.serializers.link import LinkSerializer


class GameDetailSerializer(serializers.ModelSerializer):
    """Serializer for game detail view including links."""

    links = LinkSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo', 'description', 'links']
