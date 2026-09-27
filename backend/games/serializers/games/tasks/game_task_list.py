"""Game task list serializer for the games app."""

from rest_framework import serializers

from games.models import Task
from games.serializers.games.tasks.game_task_session import GameTaskSessionSerializer


class GameTaskListSerializer(serializers.ModelSerializer):
    """Serializer for game task list items, also reused for the create/update responses."""

    session = GameTaskSessionSerializer(read_only=True)

    class Meta:
        """Metadata for the GameTaskListSerializer."""

        model = Task
        fields = [
            'id', 'short_description', 'long_description', 'completed', 'session', 'category',
        ]
