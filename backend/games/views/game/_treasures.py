"""Shared implementation for the character treasures-list endpoint."""

from ...serializers import CharacterTreasureSerializer
from ..common import paginated_list_response
from ._shared import _get_character_or_404, _hidden_gate_response


def character_treasures(request, game, character_id, npc, check_hidden):
    """Return a paginated list of treasures held by a specific character in a game.

    When `check_hidden` is True, a hidden character is gated behind the requester's edit
    permission and the response carries `X-Skip-Cache` when the character is hidden; when
    False, neither behavior applies.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
    treasures = treasures.order_by('treasure__value', 'treasure__id')
    treasures = _filter_by_search(request, treasures)
    response = paginated_list_response(request, treasures, CharacterTreasureSerializer)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def _filter_by_search(request, treasures):
    """Filter `treasures` to a case-insensitive `treasure__name` substring match on `search`."""
    search = request.GET.get('search')
    if not search:
        return treasures

    return treasures.filter(treasure__name__icontains=search)
