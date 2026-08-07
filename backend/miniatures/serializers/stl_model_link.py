"""StlModelLink serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import StlModelLink


class StlModelLinkSerializer(serializers.ModelSerializer):
    """Serializer for STL model links, mirroring `GameLinkSerializer`."""

    class Meta:
        """Metadata for the StlModelLinkSerializer."""

        model = StlModelLink
        fields = ['id', 'text', 'url', 'link_type']
