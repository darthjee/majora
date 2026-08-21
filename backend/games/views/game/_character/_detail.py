"""Shared implementation for the character detail (get-only) endpoint."""

from rest_framework.response import Response

from ...serializers import CharacterDetailSerializer
from ._decorators import check_hidden


@check_hidden
def character_detail(request, game, character, check_hidden):
    """Return detail for a specific character.

    When `check_hidden` is True, a hidden character is additionally gated behind the
    requester's edit permission, returning a 404 (carrying `X-Skip-Cache`, since that gate
    is itself requester-identity-tied) when not allowed; when False, that gate does not apply.
    A non-hidden character's successful response is safely cacheable regardless of
    `check_hidden`/requester, since no permission gate applies to it. A hidden character's
    successful response (reachable only when `check_hidden` is False, or when True and the
    requester passed the edit-permission gate) always carries `X-Skip-Cache` instead,
    mirroring `game_treasure_detail`'s handling of hidden treasures: otherwise Tent's
    identity-blind reverse-proxy cache would replay that response — revealing the hidden
    character's existence and data — to any subsequent, unauthorized caller of the same URL.
    """
    serializer = CharacterDetailSerializer(character, context={'request': request})
    response = Response(serializer.data)
    if character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
