"""Shared implementation for the character items-list and item-detail endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ...serializers import CharacterItemSerializer
from ..common import paginated_list_response
from ._shared import _get_character_or_404, _hidden_gate_response


def character_items(
    request, game, character_id, npc, check_hidden, allow_hidden=False,
    serializer_class=CharacterItemSerializer,
):
    """Return a paginated list of items held by a specific character in a game.

    Mirrors `_treasures.py::character_treasures`, simplified: `CharacterItem` has no
    `value`/`quantity` to filter or annotate, so this only handles the hidden-character gate
    (`check_hidden`) and the hidden-item filtering (`allow_hidden`). Unlike the treasure
    precedent, hidden-item filtering here is **not** limited to NPCs — per the issue, both the
    PC and NPC regular list endpoints exclude a character's own hidden items, since `hidden`
    lives directly on `CharacterItem` rather than on a separate catalog row. `serializer_class`
    defaults to `CharacterItemSerializer`; the DM-only `/items/all.json` variants pass
    `CharacterItemAllSerializer` instead, so `hidden` is only ever included in that payload.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    items = character.character_items.select_related('game_item').all()
    if not allow_hidden:
        items = items.exclude(hidden=True)
    response = paginated_list_response(request, items, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def character_item_detail(
    request, game, character_id, item_id, npc, check_hidden, allow_hidden=False,
    serializer_class=CharacterItemSerializer,
):
    """Return detail for a single item held by a specific character in a game.

    Mirrors `character_items` above, narrowed to a single row: the same hidden-character gate
    (`check_hidden`) and hidden-item filtering (`allow_hidden`) apply, but the result is a
    single `CharacterItem` (404 if not found) instead of a paginated list.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    items = character.character_items.select_related('game_item')
    if not allow_hidden:
        items = items.exclude(hidden=True)
    item = get_object_or_404(items, id=item_id)
    response = Response(serializer_class(item).data)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
