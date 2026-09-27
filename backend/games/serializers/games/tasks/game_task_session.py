"""Game task session serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameTaskSessionSerializer(serializers.ModelSerializer):
    """Read-only serializer for the session nested in a game task payload."""

    class Meta:
        """Metadata for the GameTaskSessionSerializer."""

        model = GameSession
        fields = ['id', 'title']
        read_only_fields = fields
