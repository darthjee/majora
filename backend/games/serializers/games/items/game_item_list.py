"""GameItem list serializers for the games app."""

from rest_framework import serializers

from games.models import GameItem
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GameItemListSerializer(serializers.ModelSerializer):
    """Serializer for game item list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameItemListSerializer."""

        model = GameItem
        fields = ['id', 'name', 'photo_path']


class GameItemAllListSerializer(HiddenFieldMixin, GameItemListSerializer):
    """Serializer for game item list items when hidden items are included (DM-only).

    Used only by `GET /games/:slug/items/all.json` — adds `hidden` on top of everything
    `GameItemListSerializer` already exposes; the regular, player-facing item list keeps
    omitting it entirely.
    """

    class Meta(GameItemListSerializer.Meta):
        """Metadata for the GameItemAllListSerializer."""

        fields = GameItemListSerializer.Meta.fields + ['hidden']


class GameItemDetailSerializer(GameItemListSerializer):
    """Serializer for a single game item's detail view.

    Used only by `GET /games/:slug/items/:id.json` — adds `description` on top of
    everything `GameItemListSerializer` already exposes; the index/list view keeps
    omitting it entirely.
    """

    class Meta(GameItemListSerializer.Meta):
        """Metadata for the GameItemDetailSerializer."""

        fields = GameItemListSerializer.Meta.fields + ['description']


class GameItemDetailAllSerializer(HiddenFieldMixin, GameItemDetailSerializer):
    """Serializer for a single game item's detail view, including hidden items (DM-only).

    Used only by `GET /games/:slug/items/:id/all.json` — adds `hidden` on top of
    everything `GameItemDetailSerializer` already exposes.
    """

    class Meta(GameItemDetailSerializer.Meta):
        """Metadata for the GameItemDetailAllSerializer."""

        fields = GameItemDetailSerializer.Meta.fields + ['hidden']
