"""CharacterDocumentFile serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentFile


class CharacterDocumentFileSerializer(serializers.ModelSerializer):
    """Serializer for a file attached to a character-held document's underlying game document.

    `CharacterDocument` carries no files of its own, so this serializes the underlying
    `GameDocumentFile` rows directly (mirrors `GameDocumentFileSerializer`), adding
    `character_document_id` from the requested `CharacterDocument` — passed in via serializer
    `context`, since a `GameDocumentFile` has no back-reference to which `CharacterDocument`
    it's being listed under (a `GameDocument` can be held by several characters).
    """

    character_document_id = serializers.SerializerMethodField()
    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the CharacterDocumentFileSerializer."""

        model = GameDocumentFile
        fields = ['id', 'character_document_id', 'name', 'path', 'photo_path']

    def get_character_document_id(self, obj):
        """Return the id of the CharacterDocument this file is being listed under."""
        return self.context['character_document_id']
