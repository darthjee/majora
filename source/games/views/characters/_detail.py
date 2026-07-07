"""Shared implementation for the character detail (get/update) endpoint."""

from ...permissions import CharacterEditPermission
from ...serializers import CharacterDetailSerializer, CharacterUpdateSerializer
from ..common import detail_or_update
from ._shared import _get_character_or_404, _hidden_gate_response


def character_detail(request, game, character_id, npc, check_hidden):
    """Return or update detail for a specific character.

    When `check_hidden` is True, a hidden character is gated behind the requester's edit
    permission (returning a 404 with `X-Skip-Cache` when not allowed) and the successful
    response also carries `X-Skip-Cache`; when False, neither behavior applies.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    response = detail_or_update(
        request,
        character,
        CharacterEditPermission,
        CharacterUpdateSerializer,
        CharacterDetailSerializer,
        detail_context={'request': request},
    )
    if check_hidden:
        response['X-Skip-Cache'] = 'true'
    return response
