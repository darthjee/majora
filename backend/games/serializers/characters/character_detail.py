"""Character detail serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters._photo_path import resolve_photo_path
from games.serializers.characters._treasure_value import resolve_treasure_value
from games.serializers.characters.character_link import CharacterLinkSerializer


class CharacterDetailSerializer(serializers.ModelSerializer):
    """Serializer for character detail view including links."""

    links = CharacterLinkSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()
    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    photo_path = serializers.SerializerMethodField()
    photo_id = serializers.IntegerField(source='photo.id', default=None, read_only=True)
    treasure_value = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterDetailSerializer."""

        model = Character
        fields = [
            'id',
            'name',
            'role',
            'public_description',
            'is_pc',
            'links',
            'game_slug',
            'photo_path',
            'photo_id',
            'money',
            'treasure_value',
            'public_slain',
            'public_allegiance',
        ]

    def get_treasure_value(self, obj):
        """Return the character's total treasure value."""
        return resolve_treasure_value(obj)

    def get_photo_path(self, obj):
        """Return the photo path, or None when the character is incognito."""
        return resolve_photo_path(obj)
