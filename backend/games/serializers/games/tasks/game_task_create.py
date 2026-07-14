"""Game task create serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession, Task


class GameTaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new game task."""

    session = serializers.PrimaryKeyRelatedField(
        queryset=GameSession.objects.all(), required=False, allow_null=True,
    )

    class Meta:
        """Metadata for the GameTaskCreateSerializer."""

        model = Task
        fields = ['short_description', 'long_description', 'completed', 'session']
        extra_kwargs = {
            'short_description': {'required': True},
            'long_description': {'required': False},
            'completed': {'required': False},
        }

    def validate_session(self, value):
        """Ensure a given `session` belongs to the same game as the task, if any."""
        game = self.context.get('game')
        if value is not None and game is not None and value.game_id != game.id:
            raise serializers.ValidationError('session must belong to the same game')
        return value
