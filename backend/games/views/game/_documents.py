"""Shared implementation for the character documents-list endpoints."""

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
