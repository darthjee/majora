"""Shared implementation for the character possessions-list and possession-detail endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ....serializers import CharacterPossessionSerializer
from ...common import paginated_list_response
from .._decorators import check_hidden


@check_hidden
def character_possessions(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=CharacterPossessionSerializer,
):
    """Return a paginated list of possessions held by a specific character in a game.

    Mirrors `_documents.py::character_documents`: only the hidden-character gate
    (`check_hidden`) and the hidden-possession filtering (`allow_hidden`) are handled here.
    Hidden-possession filtering is **not** limited to NPCs — per the issue, both the PC and
    NPC regular list endpoints exclude a character's own hidden possessions, since `hidden`
    lives directly on `CharacterPossession` rather than on a separate catalog row.
    `serializer_class` defaults to `CharacterPossessionSerializer`; the DM-only
    `/possessions/all.json` variants pass `CharacterPossessionAllSerializer` instead, so
    `hidden` is only ever included in that payload.
    """
    possessions = character.character_possessions.select_related('game_possession').all()
    if not allow_hidden:
        possessions = possessions.exclude(hidden=True)
    response = paginated_list_response(request, possessions, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_possession_detail(
    request, game, character, possession_id, check_hidden, allow_hidden=False,
    serializer_class=CharacterPossessionSerializer,
):
    """Return detail for a single possession held by a specific character in a game.

    Mirrors `character_possessions` above, narrowed to a single row: the same
    hidden-character gate (`check_hidden`) and hidden-possession filtering (`allow_hidden`)
    apply, but the result is a single `CharacterPossession` (404 if not found) instead of a
    paginated list. There is no `PATCH` branch — nothing is left to edit on
    `CharacterPossession` itself; edits go straight to `GamePossession`.
    """
    possessions = character.character_possessions.select_related('game_possession')
    if not allow_hidden:
        possessions = possessions.exclude(hidden=True)
    possession = get_object_or_404(possessions, id=possession_id)
    response = Response(serializer_class(possession).data)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
