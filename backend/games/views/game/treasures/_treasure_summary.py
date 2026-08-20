"""Shared implementation for the per-character/per-treasure quantity summary endpoints."""

from rest_framework.response import Response

from permissions import EndpointPermission

from .._shared import _get_character_or_404, _hidden_gate_response
from ._treasure_exchange import _find_game_treasure


def character_treasure_summary(
    request, game, character_id, treasure_id, npc, check_hidden, allow_hidden=False,
):
    """Return {'quantity': <int>}, `character`'s CharacterTreasure.quantity for `treasure_id`.

    `check_hidden` gates a hidden character behind a 404 (`_hidden_gate_response`), matching
    `character_detail`'s single-resource convention — there is no batch/list shape here to
    silently omit a hidden character from. Unlike `character_item_summary`, there is no
    `count_hidden` parameter: `CharacterTreasure` carries no `hidden` flag of its own, only
    `GameTreasure.hidden` at the catalog level, already gated by `_find_game_treasure`'s own
    hidden check (reused here rather than duplicated).

    `allow_hidden` bypasses that `GameTreasure.hidden` 404 gate — reserved for the DM-only
    `/summary/all.json` endpoints, matching `character_treasure_acquire`'s `/acquire/all.json`
    precedent; the regular player-facing summary endpoints must always call this with the
    default `False` so a hidden treasure stays inaccessible to players.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    treasure = _find_game_treasure(game, treasure_id, allow_hidden=allow_hidden)

    character_treasure = character.character_treasures.filter(treasure=treasure).first()
    quantity = character_treasure.quantity if character_treasure else 0

    return Response({'quantity': quantity})


def check_treasure_summary_all_permission(request, game, resource, character=None):
    """Return an error Response if `request.user` may not view the full treasure summary.

    Reuses the same `restricted`/`create` permission tier as the item summary's `/all.json`
    variant (`check_item_summary_all_permission`) — for a PC, `character` must be resolved so
    its owner also grants access; for an NPC (no owner concept), `character` is left `None`
    since `Roles._resolve_owner` short-circuits to `False` whenever `pc` is `None`. This lets
    the NPC `/summary/all.json` view check permission *before* ever resolving the target NPC,
    so an unauthorized/unauthenticated caller gets an identical `401`/`403` whether
    `character_id` is nonexistent, hidden, or a normal visible NPC.
    """
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, resource, 'restricted', 'create',
    )
