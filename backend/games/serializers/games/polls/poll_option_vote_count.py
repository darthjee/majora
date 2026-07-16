"""Per-option vote count serializer for the games app."""

from rest_framework import serializers


class PollOptionVoteCountSerializer(serializers.Serializer):
    """Serializer for a poll option annotated with its vote count."""

    option = serializers.IntegerField(source='id')
    count = serializers.IntegerField()
