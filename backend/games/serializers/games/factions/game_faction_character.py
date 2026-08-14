"""Character serializer for a game faction's character-list endpoints."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters._photo_path import resolve_photo_path


class GameFactionCharacterSerializer(serializers.ModelSerializer):
    """Serializer for a character as listed on a faction's character-list panel.

    Read-only, over `Character` (not `CharacterFaction`) — display fields come straight from
    the character itself, not the faction. `type` distinguishes a PC from an NPC the same way
    `shortListResourceConfig`'s `pc`/`npc` entries already do on the frontend.
    """

    photo_path = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the GameFactionCharacterSerializer."""

        model = Character
        fields = ['id', 'name', 'photo_path', 'type']

    def get_photo_path(self, obj):
        """Return the character's photo path, or None when incognito or unset."""
        return resolve_photo_path(obj)

    def get_type(self, obj):
        """Return 'pc' or 'npc', matching the frontend's shortlist resource type convention."""
        return 'pc' if obj.is_pc else 'npc'
