"""Source create serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Source


class SourceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new source, with `name` required and `url` optional."""

    class Meta:
        """Metadata for the SourceCreateSerializer."""

        model = Source
        fields = ['name', 'url']
        extra_kwargs = {
            'name': {'required': True},
            'url': {'required': False},
        }
