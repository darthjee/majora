"""Collection create serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Collection, Source


class CollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new collection, with `name` required and `url` optional.

    `source_id` is optional and, when given, sets `Collection.source` to that `Source`; when
    omitted, the collection starts with `source=None`.
    """

    source_id = serializers.PrimaryKeyRelatedField(
        source='source', queryset=Source.objects.all(), required=False, allow_null=True,
    )

    class Meta:
        """Metadata for the CollectionCreateSerializer."""

        model = Collection
        fields = ['name', 'url', 'source_id']
        extra_kwargs = {
            'name': {'required': True},
            'url': {'required': False, 'allow_null': True},
        }
