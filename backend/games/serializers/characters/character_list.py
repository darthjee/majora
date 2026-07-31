"""Character list serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters._photo_path import resolve_photo_path
from games.serializers.characters._treasure_value import resolve_treasure_value


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    photo_path = serializers.SerializerMethodField()
    treasure_value = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterListSerializer."""

        model = Character
        fields = [
            'id', 'name', 'game_slug', 'photo_path', 'public_slain', 'public_allegiance',
            'treasure_value',
        ]

    def get_treasure_value(self, obj):
        """Return the character's total treasure value."""
        return resolve_treasure_value(obj)

    def get_photo_path(self, obj):
        """Return the photo path, or None when the character is incognito."""
        return resolve_photo_path(obj)
