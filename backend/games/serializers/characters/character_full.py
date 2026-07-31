"""Character full serializer for the games app."""

from rest_framework import serializers

from games.serializers.characters.character_detail import CharacterDetailSerializer


class CharacterFullSerializer(CharacterDetailSerializer):
    """Serializer for full character detail including the private description."""

    private_allegiance = serializers.CharField(read_only=True)
    private_slain = serializers.BooleanField(read_only=True)
    hidden = serializers.BooleanField(read_only=True)
    incognito = serializers.BooleanField(read_only=True)
    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta(CharacterDetailSerializer.Meta):
        """Metadata for the CharacterFullSerializer."""

        fields = CharacterDetailSerializer.Meta.fields + [
            'private_description',
            'private_allegiance',
            'private_slain',
            'hidden',
            'incognito',
        ]
