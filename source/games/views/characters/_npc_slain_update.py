"""Shared implementation for the player-facing NPC slain-toggle endpoint."""

from ...permissions import NpcPlayerEditPermission
from ...serializers import CharacterDetailSerializer, NpcSlainUpdateSerializer
from ..common import detail_or_update
from ._shared import _get_character_or_404, _hidden_gate_response


def npc_slain_update(request, game, character_id):
    """Toggle an NPC's public-facing slain state for a player of the game, or an editor."""
    character = _get_character_or_404(game, character_id, npc=True)

    error_response = _hidden_gate_response(character, request)
    if error_response:
        return error_response

    response = detail_or_update(
        request,
        character,
        NpcPlayerEditPermission,
        NpcSlainUpdateSerializer,
        CharacterDetailSerializer,
        detail_context={'request': request},
    )
    response['X-Skip-Cache'] = 'true'
    return response
