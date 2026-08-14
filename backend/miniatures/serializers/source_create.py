"""Source create serializer for the miniatures app."""

from rest_framework import serializers

from common.serializer_fields import http_url_field
from miniatures.models import Source


class SourceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new source, with `name` required and `url` optional."""

    # Declared explicitly (rather than left to auto-mapping) so the http/https-only
    # `URLValidator` actually runs at `is_valid()` time -- see `common.serializer_fields`.
    url = http_url_field(max_length=200, required=False, allow_blank=True)

    class Meta:
        """Metadata for the SourceCreateSerializer."""

        model = Source
        fields = ['name', 'url']
        extra_kwargs = {
            'name': {'required': True},
        }
