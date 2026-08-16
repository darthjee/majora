"""GameDocumentPage create-payload serializer for the games app."""

from rest_framework import serializers


class GameDocumentPageCreateSerializer(serializers.Serializer):
    """Validate the content/order/version payload for creating a GameDocumentPage."""

    content = serializers.CharField(required=False, default='', allow_blank=True)
    order = serializers.IntegerField(min_value=0)
    version = serializers.IntegerField(min_value=1)
