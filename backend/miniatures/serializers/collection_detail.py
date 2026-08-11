"""Collection detail serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Collection, Source, StlModel


class _CollectionSourceSerializer(serializers.ModelSerializer):
    """Nested serializer for a collection's optional source: id and name only."""

    class Meta:
        """Metadata for the _CollectionSourceSerializer."""

        model = Source
        fields = ['id', 'name']


class _CollectionStlModelSerializer(serializers.ModelSerializer):
    """Nested serializer for one of a collection's linked stl_models: id and name only."""

    class Meta:
        """Metadata for the _CollectionStlModelSerializer."""

        model = StlModel
        fields = ['id', 'name']


class CollectionDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single collection's detail: id, name, url, photo_url, source, stl_models.

    `source` is `null` when unset; `stl_models` is the (possibly empty) list of linked
    `StlModel`s.
    """

    photo_url = serializers.CharField(source='photo.path', default=None, read_only=True)
    source = _CollectionSourceSerializer(read_only=True)
    stl_models = _CollectionStlModelSerializer(many=True, read_only=True)

    class Meta:
        """Metadata for the CollectionDetailSerializer."""

        model = Collection
        fields = ['id', 'name', 'url', 'photo_url', 'source', 'stl_models']
