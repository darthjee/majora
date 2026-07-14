"""GamePhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GamePhoto


class GamePhotoSerializer(serializers.ModelSerializer):
    """Serializer for game photos."""

    class Meta:
        """Metadata for the GamePhotoSerializer."""

        model = GamePhoto
        fields = ['id', 'path']
