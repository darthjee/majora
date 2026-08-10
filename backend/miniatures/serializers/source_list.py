"""Source list serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Source


class SourceListSerializer(serializers.ModelSerializer):
    """Serializer for source list items."""

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the SourceListSerializer."""

        model = Source
        fields = ['id', 'name', 'photo_url']
