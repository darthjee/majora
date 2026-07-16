"""CharacterTreasure serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterTreasure
from games.serializers.games.treasures.game_treasure_fields import resolve_treasure_value


class CharacterTreasureSerializer(serializers.ModelSerializer):
    """Serializer for a character's treasure assignment."""

    treasure_id = serializers.IntegerField(source='treasure.id', read_only=True)
    name = serializers.CharField(source='treasure.name', read_only=True)
    value = serializers.SerializerMethodField()
    photo_path = serializers.CharField(source='treasure.photo.path', default=None, read_only=True)

    def get_value(self, character_treasure):
        """Return the held treasure's value in the context game, falling back to its default."""
        return resolve_treasure_value(self.context, character_treasure.treasure)

    class Meta:
        """Metadata for the CharacterTreasureSerializer."""

        model = CharacterTreasure
        fields = ['id', 'treasure_id', 'name', 'quantity', 'value', 'photo_path']
