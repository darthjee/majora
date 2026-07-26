"""Character full list serializer for the games app (DM/admin NPC list)."""

from rest_framework import serializers

from games.serializers.characters.character_list import CharacterListSerializer


class CharacterFullListSerializer(CharacterListSerializer):
    """Serializer for the DM/admin NPC list, exposing both allegiance fields."""

    private_allegiance = serializers.CharField(read_only=True)
    private_slain = serializers.BooleanField(read_only=True)
    hidden = serializers.BooleanField(read_only=True)

    class Meta(CharacterListSerializer.Meta):
        """Metadata for the CharacterFullListSerializer."""

        fields = CharacterListSerializer.Meta.fields + [
            'private_allegiance', 'private_slain', 'hidden',
        ]
