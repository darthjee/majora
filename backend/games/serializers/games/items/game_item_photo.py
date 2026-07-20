"""GameItemPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GameItemPhoto


class GameItemPhotoSerializer(serializers.ModelSerializer):
    """Serializer for game item photos."""

    class Meta:
        """Metadata for the GameItemPhotoSerializer."""

        model = GameItemPhoto
        fields = ['id', 'path']
