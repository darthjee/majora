"""StlModel list serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModel


class StlModelListSerializer(serializers.ModelSerializer):
    """Serializer for STL model list items."""

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the StlModelListSerializer."""

        model = StlModel
        fields = ['id', 'name', 'photo_url']
