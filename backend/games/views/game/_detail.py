"""Shared implementation for the character detail (get-only) endpoint."""

from rest_framework.response import Response

from ...serializers import CharacterDetailSerializer
from ._shared import _get_character_or_404, _hidden_gate_response


def character_detail(request, game, character_id, npc, check_hidden):
    """Return detail for a specific character.

    The successful response always carries `X-Skip-Cache`, because
    `CharacterDetailSerializer` embeds requester-identity-tied fields (`can_edit`,
    `can_edit_money`, `can_exchange_treasure`) that are computed from `request.user` and
    must never be cached/shared across different requesters by the Tent reverse proxy
    (issue #730). When `check_hidden` is True, a hidden character is additionally gated
    behind the requester's edit permission, returning a 404 (also carrying
    `X-Skip-Cache`) when not allowed; when False, that gate does not apply.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    serializer = CharacterDetailSerializer(character, context={'request': request})
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response
