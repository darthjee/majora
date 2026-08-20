"""Shared implementation for the per-character/per-faction membership summary endpoints."""

from rest_framework.response import Response

from permissions import EndpointPermission

from .._shared import _get_character_or_404, _hidden_gate_response
from ._faction_exchange import _find_game_faction


def character_faction_summary(
    request, game, character_id, faction_id, npc, check_hidden, allow_hidden=False,
):
    """Return {'enlisted': <bool>} — whether `character` already belongs to `faction_id`.

    Boolean instead of `character_treasure_summary`'s `quantity`, since `CharacterFaction` is a
    plain join (`unique_together = ('character', 'game_faction')`, no quantity field). Reuses
    `_find_game_faction` (from `_faction_exchange.py`) for the game-scoping 404, exactly like
    `character_document_summary` reuses `_find_game_document`. `allow_hidden` bypasses the
    hidden-character gate — reserved for the `/summary/all.json` endpoints.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    faction = _find_game_faction(game, faction_id)
    enlisted = character.character_factions.filter(game_faction=faction).exists()

    return Response({'enlisted': enlisted})


def check_faction_summary_all_permission(request, game, resource, character=None):
    """Return an error Response if `request.user` may not view the full faction summary.

    Mirrors `check_document_summary_all_permission` exactly — reuses the
    `game_pc_faction`/`game_npc_faction` `restricted.create` tier unchanged.
    """
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, resource, 'restricted', 'create',
    )
