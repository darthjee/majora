"""Shared implementation for the character factions-list and faction-detail endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ...serializers import CharacterFactionSerializer
from ..common import paginated_list_response
from ._decorators import check_hidden


@check_hidden
def character_factions(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=CharacterFactionSerializer,
):
    """Return a paginated list of factions a specific character belongs to in a game.

    Mirrors `_documents.py::character_documents`: only the hidden-character gate
    (`check_hidden`) and the hidden-membership filtering (`allow_hidden`) are handled here.
    Hidden-membership filtering is **not** limited to NPCs — both the PC and NPC regular list
    endpoints exclude a character's own hidden faction memberships, since `hidden` lives
    directly on `CharacterFaction` rather than on a separate catalog row. `serializer_class`
    defaults to `CharacterFactionSerializer`; the DM-only `/factions/all.json` variants pass
    `CharacterFactionAllSerializer` instead, so `hidden` is only ever included in that payload.
    """
    factions = character.character_factions.select_related('game_faction').all()
    if not allow_hidden:
        factions = factions.exclude(hidden=True)
    response = paginated_list_response(request, factions, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_faction_detail(
    request, game, character, faction_id, check_hidden, allow_hidden=False,
    serializer_class=CharacterFactionSerializer,
):
    """Return detail for a single faction membership held by a specific character in a game.

    Mirrors `character_factions` above, narrowed to a single row: the same hidden-character
    gate (`check_hidden`) and hidden-membership filtering (`allow_hidden`) apply, but the
    result is a single `CharacterFaction` (404 if not found) instead of a paginated list.
    """
    factions = character.character_factions.select_related('game_faction')
    if not allow_hidden:
        factions = factions.exclude(hidden=True)
    faction = get_object_or_404(factions, id=faction_id)
    response = Response(serializer_class(faction).data)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
