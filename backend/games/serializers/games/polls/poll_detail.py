"""Poll detail serializer for the games app."""

from rest_framework import serializers

from games.models import Poll
from games.serializers.games.polls.poll_option import PollOptionSerializer


class PollDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single poll's detail, including its nested options."""

    options = PollOptionSerializer(many=True, read_only=True)

    class Meta:
        """Metadata for the PollDetailSerializer."""

        model = Poll
        fields = ['id', 'title', 'description', 'type', 'status', 'options']
