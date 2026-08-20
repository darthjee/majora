"""Shared implementation for the character document photos-list endpoint."""

from ....serializers import CharacterDocumentPhotoSerializer
from ._document_content import character_document_content


def character_document_photos(
    request, game, character_id, document_id, npc, check_hidden, allow_hidden=False,
):
    """Return a paginated list of ready photos for a document held by a specific character."""
    return character_document_content(
        request, game, character_id, document_id, npc=npc, check_hidden=check_hidden,
        content_attr='photos', serializer_class=CharacterDocumentPhotoSerializer,
        allow_hidden=allow_hidden,
    )
