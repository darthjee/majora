"""GamePossessionPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GamePossessionPhoto


class GamePossessionPhotoSerializer(serializers.ModelSerializer):
    """Serializer for game possession photos."""

    class Meta:
        """Metadata for the GamePossessionPhotoSerializer."""

        model = GamePossessionPhoto
        fields = ['id', 'path']
