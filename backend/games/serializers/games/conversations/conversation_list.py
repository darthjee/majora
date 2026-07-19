"""Conversation list serializer for the games app."""

from rest_framework import serializers


class ConversationListSerializer(serializers.Serializer):
    """Serializer for a player's conversation list, trimmed to id and title.

    Intentionally exposes only `id`/`title` — no participant list, no last-message
    preview — since the right-hand message panel and richer conversation data are
    explicitly out of scope for this endpoint (reserved for a future messages issue).
    """

    id = serializers.IntegerField()
    title = serializers.CharField()
