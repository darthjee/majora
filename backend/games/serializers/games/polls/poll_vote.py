"""Poll vote serializer for the games app."""

from rest_framework import serializers

from games.models import PollVote


class PollVoteSerializer(serializers.ModelSerializer):
    """Serializer for a single poll vote, exposing plain FK ids (not nested)."""

    class Meta:
        """Metadata for the PollVoteSerializer."""

        model = PollVote
        fields = ['id', 'option', 'user']
