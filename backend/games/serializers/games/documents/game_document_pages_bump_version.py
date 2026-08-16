"""GameDocumentPage batch version-bump payload serializer for the games app."""

from rest_framework import serializers


class GameDocumentPagesBumpVersionSerializer(serializers.Serializer):
    """Validate the version/exclude_ids payload for batch-bumping a document's page versions."""

    version = serializers.IntegerField(min_value=1)
    exclude_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list,
    )
