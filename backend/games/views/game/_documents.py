"""Shared implementation for the character documents-list and document-detail endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ...serializers import CharacterDocumentSerializer
from ..common import paginated_list_response
from ._shared import _get_character_or_404, _hidden_gate_response


def character_documents(
    request, game, character_id, npc, check_hidden, allow_hidden=False,
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
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    documents = character.character_documents.select_related('game_document').all()
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    response = paginated_list_response(request, documents, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def character_document_detail(
    request, game, character_id, document_id, npc, check_hidden, allow_hidden=False,
    serializer_class=CharacterDocumentSerializer,
):
    """Return detail for a single document held by a specific character in a game.

    Mirrors `character_documents` above, narrowed to a single row: the same hidden-character
    gate (`check_hidden`) and hidden-document filtering (`allow_hidden`) apply, but the result
    is a single `CharacterDocument` (404 if not found) instead of a paginated list. Also
    mirrors `_items.py::character_item_detail`, minus the `description` tier — no equivalent
    exists for `CharacterDocument` (see `character_document.py`'s serializer module).
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    documents = character.character_documents.select_related('game_document')
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    document = get_object_or_404(documents, id=document_id)
    response = Response(serializer_class(document).data)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
