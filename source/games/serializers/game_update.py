"""Game update serializer for the games app."""

from rest_framework import serializers

from games.models import Game


class GameUpdateSerializer(serializers.ModelSerializer):

    """Serializer for the limited set of fields that may be edited on a game."""

    class Meta:
        model = Game
        fields = ['name', 'photo', 'description']
        extra_kwargs = {field: {'required': False} for field in fields}
