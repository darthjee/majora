"""GameFactionPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GameFactionPhoto


class GameFactionPhotoSerializer(serializers.ModelSerializer):
    """Serializer for faction photos."""

    class Meta:
        """Metadata for the GameFactionPhotoSerializer."""

        model = GameFactionPhoto
        fields = ['id', 'path']
