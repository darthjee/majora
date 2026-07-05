"""Game detail serializer for the games app."""

from rest_framework import serializers

from games.models import Game
from games.serializers.game_photo import GamePhotoSerializer
from games.serializers.link import LinkSerializer


class GameDetailSerializer(serializers.ModelSerializer):
    """Serializer for game detail view including links and photos."""

    links = LinkSerializer(many=True, read_only=True)
    photos = GamePhotoSerializer(many=True, read_only=True)
    cover_photo_path = serializers.CharField(
        source='cover_photo.path', default=None, read_only=True
    )

    class Meta:
        """Metadata for the GameDetailSerializer."""

        model = Game
        fields = [
            'name',
            'game_slug',
            'description',
            'links',
            'photos',
            'cover_photo_path',
        ]
