"""Shared implementation for the player-facing narrow NPC update endpoint."""

from ....permissions import NpcPlayerEditPermission
from ....serializers import CharacterDetailSerializer, NpcPlayerUpdateSerializer
from ...common import detail_or_update
from .._shared import _get_character_or_404, _hidden_gate_response


def npc_player_update(request, game, character_id):
    """Apply the narrow, player-facing NPC update for a player of the game, or an editor."""
    character = _get_character_or_404(game, character_id, npc=True)

    error_response = _hidden_gate_response(character, request)
    if error_response:
        return error_response

    response = detail_or_update(
        request,
        character,
        NpcPlayerEditPermission,
        NpcPlayerUpdateSerializer,
        CharacterDetailSerializer,
        detail_context={'request': request},
    )
    response['X-Skip-Cache'] = 'true'
    return response
