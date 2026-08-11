"""StlModel detail serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModel

from .collection import CollectionSerializer
from .source import SourceSerializer
from .stl_model_link import StlModelLinkSerializer


class StlModelDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single STL model's detail: links, sources/collections, and tag names."""

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)
    links = StlModelLinkSerializer(many=True, read_only=True)
    sources = SourceSerializer(many=True, read_only=True)
    collections = CollectionSerializer(many=True, read_only=True)
    tags = serializers.SlugRelatedField(many=True, slug_field='name', read_only=True)

    class Meta:
        """Metadata for the StlModelDetailSerializer."""

        model = StlModel
        fields = [
            'id', 'name', 'owned', 'type', 'race', 'role', 'photo_url', 'links', 'sources',
            'collections', 'tags',
        ]
