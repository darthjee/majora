"""Poll create serializer for the games app."""

from rest_framework import serializers

from games.models import Poll, PollOption
from games.serializers.games.polls.poll_option_write import PollOptionWriteSerializer

#: Maximum number of `options` entries accepted in a single poll create payload, to bound
#: the size of the unbatched `bulk_create` issued per request.
MAX_OPTIONS = 50


class PollCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new poll together with its options."""

    options = PollOptionWriteSerializer(many=True)

    class Meta:
        """Metadata for the PollCreateSerializer."""

        model = Poll
        fields = ['title', 'description', 'type', 'option_type', 'options']
        extra_kwargs = {
            'title': {'required': True, 'allow_blank': False},
            'description': {'required': False},
            'type': {'required': False},
            'option_type': {'required': False},
        }

    def validate_options(self, value):
        """Ensure between one and `MAX_OPTIONS` options are provided."""
        if not value:
            raise serializers.ValidationError('At least one option is required.')
        if len(value) > MAX_OPTIONS:
            raise serializers.ValidationError(f'A poll may have at most {MAX_OPTIONS} options.')
        return value

    def create(self, validated_data):
        """Create the poll as open, along with its options, in a single request."""
        options = validated_data.pop('options')
        poll = Poll.objects.create(
            game=self.context['game'], status=Poll.STATUS_OPEN, **validated_data,
        )
        PollOption.objects.bulk_create(
            [PollOption(poll=poll, option=entry['option']) for entry in options],
        )
        return poll
