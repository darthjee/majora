"""Character list serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters._profile_photo_path import resolve_profile_photo_path
from games.serializers.characters._treasure_value import resolve_treasure_value


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    profile_photo_path = serializers.SerializerMethodField()
    treasure_value = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterListSerializer."""

        model = Character
        fields = [
            'id', 'name', 'game_slug', 'profile_photo_path', 'public_slain', 'public_allegiance',
            'treasure_value',
        ]

    def get_treasure_value(self, obj):
        """Return the character's total treasure value."""
        return resolve_treasure_value(obj)

    def get_profile_photo_path(self, obj):
        """Return the profile photo path, or None when the character is incognito."""
        return resolve_profile_photo_path(obj)
