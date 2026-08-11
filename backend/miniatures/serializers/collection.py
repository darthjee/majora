"""Collection serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Collection


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer for a `StlModel`'s collections -- name only, no id."""

    class Meta:
        """Metadata for the CollectionSerializer."""

        model = Collection
        fields = ['name']
