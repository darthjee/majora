"""Source detail serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Source


class SourceDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single source's detail: id, name, url, and photo_url."""

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the SourceDetailSerializer."""

        model = Source
        fields = ['id', 'name', 'url', 'photo_url']
