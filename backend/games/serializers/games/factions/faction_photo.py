"""FactionPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import FactionPhoto


class FactionPhotoSerializer(serializers.ModelSerializer):
    """Serializer for faction photos."""

    class Meta:
        """Metadata for the FactionPhotoSerializer."""

        model = FactionPhoto
        fields = ['id', 'path']
