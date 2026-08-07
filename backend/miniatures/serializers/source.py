"""Source serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Source


class SourceSerializer(serializers.ModelSerializer):
    """Serializer for a `StlModel`'s sources -- name only, no id."""

    class Meta:
        """Metadata for the SourceSerializer."""

        model = Source
        fields = ['name']
