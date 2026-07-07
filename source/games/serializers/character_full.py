"""Character full serializer for the games app."""

from rest_framework import serializers

from games.serializers.character_detail import CharacterDetailSerializer


class CharacterFullSerializer(CharacterDetailSerializer):
    """Serializer for full character detail including the private description."""

    allegiance = serializers.CharField(read_only=True)
    public_allegiance = serializers.CharField(read_only=True)

    class Meta(CharacterDetailSerializer.Meta):
        """Metadata for the CharacterFullSerializer."""

        fields = CharacterDetailSerializer.Meta.fields + [
            'private_description',
            'public_allegiance',
        ]
