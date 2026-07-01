"""GamePhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GamePhoto


class GamePhotoSerializer(serializers.ModelSerializer):
    """Serializer for game photos."""

    class Meta:
        model = GamePhoto
        fields = ['id', 'url']
