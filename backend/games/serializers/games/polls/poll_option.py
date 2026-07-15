"""Poll option (read-only) serializer for the games app."""

from rest_framework import serializers

from games.models import PollOption


class PollOptionSerializer(serializers.ModelSerializer):
    """Serializer for a poll option, nested inside `PollDetailSerializer`."""

    class Meta:
        """Metadata for the PollOptionSerializer."""

        model = PollOption
        fields = ['id', 'option']
