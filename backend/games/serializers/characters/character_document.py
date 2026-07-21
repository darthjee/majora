"""CharacterDocument serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterDocument
from games.serializers.games.documents.character_document_fields import (
    resolve_character_document_field,
    resolve_character_document_photo_path,
)
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterDocumentSerializer(serializers.ModelSerializer):
    """Serializer for a character's document assignment."""

    game_document_id = serializers.IntegerField(source='game_document.id', read_only=True)
    name = serializers.SerializerMethodField()
    photo_path = serializers.SerializerMethodField()

    def get_name(self, character_document):
        """Return the character document's name, falling back to its game document's name."""
        return resolve_character_document_field(character_document, 'name')

    def get_photo_path(self, character_document):
        """Return the character document's resolved photo path."""
        return resolve_character_document_photo_path(character_document)

    class Meta:
        """Metadata for the CharacterDocumentSerializer."""

        model = CharacterDocument
        fields = ['id', 'game_document_id', 'name', 'photo_path']


class CharacterDocumentAllSerializer(HiddenFieldMixin, CharacterDocumentSerializer):
    """Serializer for a character's document assignment, including hidden documents (DM-only).

    Used only by the `/documents/all.json` variants — adds `hidden` on top of everything
    `CharacterDocumentSerializer` already exposes; the regular, player-facing documents list
    keeps omitting it entirely.
    """

    class Meta(CharacterDocumentSerializer.Meta):
        """Metadata for the CharacterDocumentAllSerializer."""

        fields = CharacterDocumentSerializer.Meta.fields + ['hidden']
