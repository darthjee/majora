"""GameDocumentFile serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentFile


class GameDocumentFileSerializer(serializers.ModelSerializer):
    """Serializer for game document files."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameDocumentFileSerializer."""

        model = GameDocumentFile
        fields = ['id', 'name', 'path', 'photo_path']
