"""CharacterDocumentPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentPhoto


class CharacterDocumentPhotoSerializer(serializers.ModelSerializer):
    """Serializer for a photo attached to a character-held document's underlying game document.

    `CharacterDocument` carries no photos of its own, so this serializes the underlying
    `GameDocumentPhoto` rows directly (mirrors `GameDocumentPhotoSerializer`), adding
    `character_document_id` from the requested `CharacterDocument` — see
    `CharacterDocumentFileSerializer` for why this can't simply be a model field.
    """

    character_document_id = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterDocumentPhotoSerializer."""

        model = GameDocumentPhoto
        fields = ['id', 'character_document_id', 'path']

    def get_character_document_id(self, obj):
        """Return the id of the CharacterDocument this photo is being listed under."""
        return self.context['character_document_id']
