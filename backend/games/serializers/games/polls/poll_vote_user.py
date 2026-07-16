"""Poll voter (user) serializer for the games app."""

from rest_framework import serializers

from games.serializers.games.sessions.messages.session_message_user import (
    SessionMessageUserSerializer,
)


class PollVoteUserSerializer(SessionMessageUserSerializer):
    """Serializer exposing a poll voter's id, name, and avatar URL."""

    id = serializers.IntegerField()
