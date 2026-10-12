"""Staff copy result serializer: one `links` entry of a `POST staff/copies/<type>/<id>.json`."""

from rest_framework import serializers

from uploads.models import Upload


class StaffCopyResultLinkSerializer(serializers.ModelSerializer):
    """Serializer for a link created by a copy: its upload id, type and token, never paths."""

    upload_id = serializers.IntegerField(source='pk')

    class Meta:
        """Metadata for the StaffCopyResultLinkSerializer."""

        model = Upload
        fields = ['upload_id', 'upload_type', 'token']
