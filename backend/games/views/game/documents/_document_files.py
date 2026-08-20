"""Shared implementation for the character document files-list endpoint."""

from ....serializers import CharacterDocumentFileSerializer
from ._document_content import character_document_content


def character_document_files(
    request, game, character_id, document_id, npc, check_hidden, allow_hidden=False,
):
    """Return a paginated list of ready files for a document held by a specific character."""
    return character_document_content(
        request, game, character_id, document_id, npc=npc, check_hidden=check_hidden,
        content_attr='files', serializer_class=CharacterDocumentFileSerializer,
        allow_hidden=allow_hidden,
    )
