"""Shared implementation for the player-facing narrow NPC update endpoint."""

from permissions import EndpointPermission

from ....serializers import CharacterDetailSerializer, NpcPlayerUpdateSerializer
from ...common import detail_or_update
from .._shared import _get_character_or_404, _hidden_gate_response


def _check_npc_player_edit(request, character):
    """Return an error Response if `request.user` may not perform this NPC edit, else None."""
    return EndpointPermission(request.user, game=character.game, pc=character).check(
        request, 'game_npc', 'regular', 'player_edit',
    )


def npc_player_update(request, game, character_id):
    """Apply the narrow, player-facing NPC update for a player of the game, or an editor."""
    character = _get_character_or_404(game, character_id, npc=True)

    error_response = _hidden_gate_response(character, request)
    if error_response:
        return error_response

    response = detail_or_update(
        request,
        character,
        _check_npc_player_edit,
        NpcPlayerUpdateSerializer,
        CharacterDetailSerializer,
        detail_context={'request': request},
    )
    # This endpoint is PATCH-only in practice, and the whole response is gated behind
    # _check_npc_player_edit(), so it must never be cached/shared across requesters
    # by Tent's identity-blind reverse-proxy cache, which would otherwise replay one
    # caller's authorized response to any subsequent, unauthorized caller of the same URL.
    response['X-Skip-Cache'] = 'true'
    return response
