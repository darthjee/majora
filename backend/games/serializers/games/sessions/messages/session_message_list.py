"""Session message list/detail serializer for the games app."""

from rest_framework import serializers

from games.models import GameSessionMessage

from .session_message_user import SessionMessageUserSerializer


class SessionMessageListSerializer(serializers.ModelSerializer):
    """Serializer for session message list items, also reused for the create response."""

    user = SessionMessageUserSerializer(read_only=True)

    class Meta:
        """Metadata for the SessionMessageListSerializer."""

        model = GameSessionMessage
        fields = ['id', 'content', 'user', 'created_at']
