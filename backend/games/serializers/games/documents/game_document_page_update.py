"""GameDocumentPage update-payload serializer for the games app."""

from rest_framework import serializers


class GameDocumentPageUpdateSerializer(serializers.Serializer):
    """Validate the content/version payload for updating a GameDocumentPage."""

    content = serializers.CharField(required=False, default='', allow_blank=True)
    version = serializers.IntegerField(min_value=1)
