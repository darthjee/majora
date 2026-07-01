"""Photo serializer for the games app."""

from rest_framework import serializers

from games.models import Photo


class PhotoSerializer(serializers.ModelSerializer):

    """Serializer for character photos."""

    class Meta:
        model = Photo
        fields = ['id', 'url']
