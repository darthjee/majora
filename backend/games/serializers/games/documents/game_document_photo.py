"""GameDocumentPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentPhoto


class GameDocumentPhotoSerializer(serializers.ModelSerializer):
    """Serializer for game document photos."""

    class Meta:
        """Metadata for the GameDocumentPhotoSerializer."""

        model = GameDocumentPhoto
        fields = ['id', 'path']
