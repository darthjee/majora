"""GamePossession list serializers for the games app."""

from rest_framework import serializers

from games.models import GamePossession
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GamePossessionListSerializer(serializers.ModelSerializer):
    """Serializer for game possession list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GamePossessionListSerializer."""

        model = GamePossession
        fields = ['id', 'name', 'photo_path']


class GamePossessionAllListSerializer(HiddenFieldMixin, GamePossessionListSerializer):
    """Serializer for game possession list items when hidden possessions are included (DM-only).

    Used only by `GET /games/:slug/possessions/all.json` — adds `hidden` on top of everything
    `GamePossessionListSerializer` already exposes; the regular, player-facing possession list
    keeps omitting it entirely.
    """

    class Meta(GamePossessionListSerializer.Meta):
        """Metadata for the GamePossessionAllListSerializer."""

        fields = GamePossessionListSerializer.Meta.fields + ['hidden']


class GamePossessionDetailSerializer(GamePossessionListSerializer):
    """Serializer for a single game possession's detail view.

    Used only by `GET /games/:slug/possessions/:id.json` — adds `description` on top of
    everything `GamePossessionListSerializer` already exposes; the index/list view keeps
    omitting it entirely.
    """

    class Meta(GamePossessionListSerializer.Meta):
        """Metadata for the GamePossessionDetailSerializer."""

        fields = GamePossessionListSerializer.Meta.fields + ['description']


class GamePossessionDetailFullSerializer(HiddenFieldMixin, GamePossessionDetailSerializer):
    """Serializer for a single game possession's detail view, including hidden ones (DM-only).

    Used only by `GET /games/:slug/possessions/:id/full.json` — adds `hidden` on top of
    everything `GamePossessionDetailSerializer` already exposes.
    """

    class Meta(GamePossessionDetailSerializer.Meta):
        """Metadata for the GamePossessionDetailFullSerializer."""

        fields = GamePossessionDetailSerializer.Meta.fields + ['hidden']
