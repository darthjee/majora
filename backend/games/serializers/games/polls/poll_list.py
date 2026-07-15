"""Poll list serializer for the games app."""

from rest_framework import serializers

from games.models import Poll


class PollListSerializer(serializers.ModelSerializer):
    """Serializer for game poll list items, trimmed compared to the detail shape."""

    class Meta:
        """Metadata for the PollListSerializer."""

        model = Poll
        fields = ['id', 'title', 'type', 'status']
