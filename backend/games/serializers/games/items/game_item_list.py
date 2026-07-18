"""GameItem list serializers for the games app."""

from rest_framework import serializers

from games.models import GameItem


class GameItemListSerializer(serializers.ModelSerializer):
    """Serializer for game item list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameItemListSerializer."""

        model = GameItem
        fields = ['id', 'name', 'description', 'photo_path']


class GameItemAllListSerializer(GameItemListSerializer):
    """Serializer for game item list items when hidden items are included (DM-only).

    Used only by `GET /games/:slug/items/all.json` — adds `hidden` on top of everything
    `GameItemListSerializer` already exposes; the regular, player-facing item list keeps
    omitting it entirely.
    """

    class Meta(GameItemListSerializer.Meta):
        """Metadata for the GameItemAllListSerializer."""

        fields = GameItemListSerializer.Meta.fields + ['hidden']
