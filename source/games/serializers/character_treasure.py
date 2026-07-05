"""CharacterTreasure serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterTreasure


class CharacterTreasureSerializer(serializers.ModelSerializer):
    """Serializer for a character's treasure assignment."""

    name = serializers.CharField(source='treasure.name', read_only=True)
    value = serializers.IntegerField(source='treasure.value', read_only=True)

    class Meta:
        """Metadata for the CharacterTreasureSerializer."""

        model = CharacterTreasure
        fields = ['id', 'name', 'quantity', 'value']
