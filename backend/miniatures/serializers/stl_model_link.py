"""StlModelLink serializer for the miniatures app."""

from rest_framework import serializers

from common.serializer_fields import http_url_field
from miniatures.models import StlModelLink


class StlModelLinkSerializer(serializers.ModelSerializer):
    """Serializer for STL model links, mirroring `GameLinkSerializer`."""

    # Declared explicitly (rather than left to auto-mapping) so the http/https-only
    # `URLValidator` actually runs at `is_valid()` time -- see `common.serializer_fields`.
    url = http_url_field(max_length=200)

    class Meta:
        """Metadata for the StlModelLinkSerializer."""

        model = StlModelLink
        fields = ['id', 'text', 'url', 'link_type']
