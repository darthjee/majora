"""Character list serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')

    class Meta:
        model = Character
        fields = ['id', 'name', 'avatar_url', 'game_slug']
