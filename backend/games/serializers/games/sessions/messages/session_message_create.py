"""Session message create serializer for the games app."""

from rest_framework import serializers

from games.models import GameSessionMessage


class SessionMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new session message."""

    class Meta:
        """Metadata for the SessionMessageCreateSerializer."""

        model = GameSessionMessage
        fields = ['content']
        extra_kwargs = {'content': {'required': True}}
