"""Session-scoped poll create serializer for the games app."""

from rest_framework import serializers

from games.models import Poll, PollOption
from games.serializers.games.polls.poll_create import MAX_OPTIONS

#: Default title assigned to polls created from a game session's "Create Pool" action.
DEFAULT_TITLE = 'Next session date'


class SessionPollCreateSerializer(serializers.Serializer):
    """Serializer for creating a session-scoped, date-options poll from a list of dates."""

    dates = serializers.ListField(child=serializers.DateField(), allow_empty=False)

    def validate_dates(self, value):
        """Ensure at most `MAX_OPTIONS` dates are provided."""
        if len(value) > MAX_OPTIONS:
            raise serializers.ValidationError(f'A poll may have at most {MAX_OPTIONS} options.')
        return value

    def create(self, validated_data):
        """Create the session-scoped date poll as open, along with one option per date."""
        poll = Poll.objects.create(
            game=self.context['game'],
            status=Poll.STATUS_OPEN,
            option_type=Poll.OPTION_TYPE_DATE,
            type=Poll.TYPE_SINGLE,
            title=DEFAULT_TITLE,
            content_object=self.context['session'],
        )
        PollOption.objects.bulk_create(
            [
                PollOption(poll=poll, option=date.isoformat())
                for date in validated_data['dates']
            ],
        )
        return poll
