"""Character full list serializer for the games app (DM/admin NPC list)."""

from rest_framework import serializers

from games.serializers.characters.character_list import CharacterListSerializer


class CharacterFullListSerializer(CharacterListSerializer):
    """Serializer for the DM/admin NPC list, exposing both allegiance fields."""

    allegiance = serializers.CharField(read_only=True)
    public_allegiance = serializers.CharField(read_only=True)
    slain = serializers.BooleanField(read_only=True)
    public_slain = serializers.BooleanField(read_only=True)

    class Meta(CharacterListSerializer.Meta):
        """Metadata for the CharacterFullListSerializer."""

        fields = CharacterListSerializer.Meta.fields + ['public_allegiance', 'public_slain']
