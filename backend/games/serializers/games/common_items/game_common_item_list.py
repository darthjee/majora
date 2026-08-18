"""GameCommonItem list/detail serializers for the games app."""

from rest_framework import serializers

from games.models import GameCommonItem
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GameCommonItemListSerializer(serializers.ModelSerializer):
    """Serializer for game common item list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameCommonItemListSerializer."""

        model = GameCommonItem
        fields = ['id', 'name', 'photo_path', 'price', 'category']


class GameCommonItemAllListSerializer(HiddenFieldMixin, GameCommonItemListSerializer):
    """Serializer for game common item list items when hidden items are included (DM-only).

    Used only by `GET /games/:slug/common_items/all.json` — adds `hidden` on top of everything
    `GameCommonItemListSerializer` already exposes; the regular, player-facing list keeps
    omitting it entirely.
    """

    class Meta(GameCommonItemListSerializer.Meta):
        """Metadata for the GameCommonItemAllListSerializer."""

        fields = GameCommonItemListSerializer.Meta.fields + ['hidden']


class GameCommonItemDetailSerializer(GameCommonItemListSerializer):
    """Serializer for a single game common item's detail view.

    Used only by `GET /games/:slug/common_items/:id.json` — adds `description` on top of
    everything `GameCommonItemListSerializer` already exposes; the index/list view keeps
    omitting it entirely.
    """

    class Meta(GameCommonItemListSerializer.Meta):
        """Metadata for the GameCommonItemDetailSerializer."""

        fields = GameCommonItemListSerializer.Meta.fields + ['description']


class GameCommonItemDetailFullSerializer(HiddenFieldMixin, GameCommonItemDetailSerializer):
    """Serializer for a single game common item's detail view, including hidden ones (DM-only).

    Used only by `GET /games/:slug/common_items/:id/full.json` — adds `hidden` on top of
    everything `GameCommonItemDetailSerializer` already exposes.
    """

    class Meta(GameCommonItemDetailSerializer.Meta):
        """Metadata for the GameCommonItemDetailFullSerializer."""

        fields = GameCommonItemDetailSerializer.Meta.fields + ['hidden']
