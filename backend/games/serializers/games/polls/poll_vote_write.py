"""Poll vote write serializer for the games app."""

from rest_framework import serializers


class PollVoteWriteSerializer(serializers.Serializer):
    """Validates a `PUT` vote payload: the list of option ids to cast for a poll.

    Plain (non-`ModelSerializer`) serializer: the write path is handled by
    `SinglePollVoteWriter`/`MultiplePollVoteWriter`, not `.save()`. Requires
    `context['poll']` to validate that each id belongs to that poll.
    """

    option_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)

    def validate_option_ids(self, value):
        """Ensure every id in `value` is an existing `PollOption` belonging to the poll."""
        poll = self.context['poll']
        valid_ids = set(poll.options.values_list('id', flat=True))
        if not set(value).issubset(valid_ids):
            raise serializers.ValidationError('All option ids must belong to the poll.')
        return value
