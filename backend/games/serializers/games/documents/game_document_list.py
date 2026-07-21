"""GameDocument list serializers for the games app."""

from rest_framework import serializers

from games.models import GameDocument
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GameDocumentListSerializer(serializers.ModelSerializer):
    """Serializer for game document list items."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameDocumentListSerializer."""

        model = GameDocument
        fields = ['id', 'name', 'photo_path']


class GameDocumentAllListSerializer(HiddenFieldMixin, GameDocumentListSerializer):
    """Serializer for game document list items when hidden documents are included (DM-only).

    Used only by `GET /games/:slug/documents/all.json` — adds `hidden` on top of everything
    `GameDocumentListSerializer` already exposes; the regular, player-facing document list
    keeps omitting it entirely.
    """

    class Meta(GameDocumentListSerializer.Meta):
        """Metadata for the GameDocumentAllListSerializer."""

        fields = GameDocumentListSerializer.Meta.fields + ['hidden']
