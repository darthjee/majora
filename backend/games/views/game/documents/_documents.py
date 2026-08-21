"""Shared implementation for the character documents-list and document-detail endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ....serializers import CharacterDocumentSerializer
from ...common import paginated_list_response
from .._character._decorators import check_hidden


@check_hidden
def character_documents(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=CharacterDocumentSerializer,
):
    """Return a paginated list of documents held by a specific character in a game.

    Mirrors `_items.py::character_items`: only the hidden-character gate (`check_hidden`)
    and the hidden-document filtering (`allow_hidden`) are handled here — no detail
    counterpart exists for documents (see the module docstring in `_items.py` for the shape
    this was copied from). Hidden-document filtering is **not** limited to NPCs — per the
    issue, both the PC and NPC regular list endpoints exclude a character's own hidden
    documents, since `hidden` lives directly on `CharacterDocument` rather than on a separate
    catalog row. `serializer_class` defaults to `CharacterDocumentSerializer`; the DM-only
    `/documents/all.json` variants pass `CharacterDocumentAllSerializer` instead, so `hidden`
    is only ever included in that payload.
    """
    documents = character.character_documents.select_related('game_document').all()
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    response = paginated_list_response(request, documents, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_document_detail(
    request, game, character, document_id, check_hidden, allow_hidden=False,
    serializer_class=CharacterDocumentSerializer,
):
    """Return detail for a single document held by a specific character in a game.

    Mirrors `character_documents` above, narrowed to a single row: the same hidden-character
    gate (`check_hidden`) and hidden-document filtering (`allow_hidden`) apply, but the result
    is a single `CharacterDocument` (404 if not found) instead of a paginated list. Also
    mirrors `_items.py::character_item_detail`, minus the `description` tier — no equivalent
    exists for `CharacterDocument` (see `character_document.py`'s serializer module).
    """
    documents = character.character_documents.select_related('game_document')
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    document = get_object_or_404(documents, id=document_id)
    response = Response(serializer_class(document).data)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
