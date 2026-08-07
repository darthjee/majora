"""Shared implementation for the per-character/per-item quantity summary endpoints."""

from django.http import Http404
from rest_framework.response import Response

from permissions import EndpointPermission

from ._shared import _get_character_or_404, _hidden_gate_response


def character_item_summary(request, game, character_id, item_id, npc, check_hidden, count_hidden):
    """Return {'quantity': <int>}, the count of `character`'s CharacterItem rows for `item_id`.

    `check_hidden` gates a hidden character behind a 404 (`_hidden_gate_response`), matching
    `character_detail`'s single-resource convention — there is no batch/list shape here to
    silently omit a hidden character from. `count_hidden` includes `CharacterItem.hidden=True`
    rows in the count — reserved for the dm/admin(/owner)-only `/summary/all.json` variant.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    game_item = _find_game_item(game, item_id)

    items = character.character_items.filter(game_item=game_item)
    if not count_hidden:
        items = items.filter(hidden=False)

    return Response({'quantity': items.count()})


def _find_game_item(game, item_id):
    """Return the GameItem matching `item_id` scoped to `game`, or raise Http404.

    Unlike `_item_exchange._find_game_item`, this never gates on `GameItem.hidden` — whether
    the requester can reach this item at all is already decided by the item detail
    page/endpoint, not by the summary endpoint.
    """
    game_item = game.items.filter(id=item_id).first()
    if game_item is None:
        raise Http404
    return game_item


def check_item_summary_all_permission(request, game, resource, character=None):
    """Return an error Response if `request.user` may not view the full item summary.

    Reuses the same `restricted`/`create` permission tier the acquire/remove endpoints check
    (`_check_item_create` in `_item_exchange.py`) — for a PC, `character` must be resolved so
    its owner also grants access; for an NPC (no owner concept), `character` is left `None`
    since `Roles._resolve_owner` short-circuits to `False` whenever `pc` is `None`. This lets
    the NPC `/summary/all.json` view check permission *before* ever resolving the target NPC,
    so an unauthorized/unauthenticated caller gets an identical `401`/`403` whether
    `character_id` is nonexistent, hidden, or a normal visible NPC.
    """
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, resource, 'restricted', 'create',
    )
