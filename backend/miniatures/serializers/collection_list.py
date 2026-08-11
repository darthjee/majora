"""Collection list serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Collection


class CollectionListSerializer(serializers.ModelSerializer):
    """Serializer for collection list items."""

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)
    stl_model_count = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CollectionListSerializer."""

        model = Collection
        fields = ['id', 'name', 'photo_url', 'stl_model_count']

    def get_stl_model_count(self, obj):
        """Return the number of stl_models linked to this collection."""
        return obj.stl_models.count()
