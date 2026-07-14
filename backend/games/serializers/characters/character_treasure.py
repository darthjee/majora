"""CharacterTreasure serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterTreasure


class CharacterTreasureSerializer(serializers.ModelSerializer):
    """Serializer for a character's treasure assignment."""

    treasure_id = serializers.IntegerField(source='treasure.id', read_only=True)
    name = serializers.CharField(source='treasure.name', read_only=True)
    value = serializers.IntegerField(source='treasure.value', read_only=True)
    photo_path = serializers.CharField(source='treasure.photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the CharacterTreasureSerializer."""

        model = CharacterTreasure
        fields = ['id', 'treasure_id', 'name', 'quantity', 'value', 'photo_path']
