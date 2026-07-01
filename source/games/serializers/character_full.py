"""Character full serializer for the games app."""

from games.serializers.character_detail import CharacterDetailSerializer


class CharacterFullSerializer(CharacterDetailSerializer):

    """Serializer for full character detail including the private description."""

    class Meta(CharacterDetailSerializer.Meta):
        fields = CharacterDetailSerializer.Meta.fields + ['private_description']
