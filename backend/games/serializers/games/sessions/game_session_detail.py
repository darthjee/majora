"""Game session detail serializer for the games app."""

from rest_framework import serializers

from games.models import GameSession


class GameSessionDetailSerializer(serializers.ModelSerializer):
    """Serializer for game session detail view."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    can_edit = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the GameSessionDetailSerializer."""

        model = GameSession
        fields = ['id', 'title', 'date', 'description', 'game_slug', 'can_edit']

    def get_can_edit(self, obj):
        """Return whether the requesting user (from context) may edit this session."""
        request = self.context.get('request')
        user = request.user if request else None
        return obj.can_be_edited_by(user)
