"""Character list serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    profile_photo_path = serializers.CharField(
        source='profile_photo.path', default=None, read_only=True
    )
    slain = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the CharacterListSerializer."""

        model = Character
        fields = ['id', 'name', 'game_slug', 'profile_photo_path', 'slain']
