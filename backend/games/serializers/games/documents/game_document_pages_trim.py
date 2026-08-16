"""GameDocumentPage bulk-trim payload serializer for the games app."""

from rest_framework import serializers


class GameDocumentPagesTrimSerializer(serializers.Serializer):
    """Validate the `keep` payload for bulk-trimming a document's excess pages."""

    keep = serializers.IntegerField(min_value=0)
