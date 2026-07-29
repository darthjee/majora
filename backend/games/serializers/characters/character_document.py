"""CharacterDocument serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterDocument
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterDocumentSerializer(serializers.ModelSerializer):
    """Serializer for a character's document assignment.

    `CharacterDocument` is a thin join — `name`/`photo_path` are sourced straight from the
    linked `GameDocument`, with no override/fallback logic left to resolve.
    """

    game_document_id = serializers.IntegerField(source='game_document.id', read_only=True)
    name = serializers.CharField(source='game_document.name', read_only=True)
    photo_path = serializers.CharField(
        source='game_document.photo.path', default=None, read_only=True,
    )

    class Meta:
        """Metadata for the CharacterDocumentSerializer."""

        model = CharacterDocument
        fields = ['id', 'game_document_id', 'name', 'photo_path']


class CharacterDocumentAllSerializer(HiddenFieldMixin, CharacterDocumentSerializer):
    """Serializer for a character's document assignment, including hidden documents (DM-only).

    Used by the `/documents/all.json` and `/documents/:id/full.json` variants — adds `hidden`
    on top of everything `CharacterDocumentSerializer` already exposes; the regular,
    player-facing document endpoints keep omitting it entirely.
    """

    class Meta(CharacterDocumentSerializer.Meta):
        """Metadata for the CharacterDocumentAllSerializer."""

        fields = CharacterDocumentSerializer.Meta.fields + ['hidden']
