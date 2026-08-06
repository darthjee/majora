"""Shared implementation for the per-character/per-document ownership summary endpoints."""

from rest_framework.response import Response

from ...permissions import EndpointPermission
from ._document_exchange import _find_game_document
from ._shared import _get_character_or_404, _hidden_gate_response


def character_document_summary(
    request, game, character_id, document_id, npc, check_hidden, allow_hidden=False,
):
    """Return {'owned': <bool>} — whether `character` already owns `document_id`.

    Boolean instead of `character_treasure_summary`'s `quantity`, since `CharacterDocument` is a
    plain join (`unique_together = ('character', 'game_document')`, no quantity field). Reuses
    `_find_game_document` (from `_document_exchange.py`) for the hidden-`GameDocument` gate,
    exactly like `character_treasure_summary` reuses `_find_game_treasure`. `allow_hidden`
    bypasses that gate — reserved for the `/summary/all.json` endpoints.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    document = _find_game_document(game, document_id, allow_hidden)
    owned = character.character_documents.filter(game_document=document).exists()

    return Response({'owned': owned})


def check_document_summary_all_permission(request, game, resource, character=None):
    """Return an error Response if `request.user` may not view the full document summary.

    Mirrors `check_treasure_summary_all_permission` exactly — reuses the existing
    `game_pc_document`/`game_npc_document` `restricted.create` tier unchanged (see Step 5's Notes
    for why no new permission config is needed here).
    """
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, resource, 'restricted', 'create',
    )
