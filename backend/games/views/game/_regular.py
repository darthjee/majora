"""Shared implementation for the PC-only, player-writable regular update endpoint (issue #865)."""

from ...permissions import CharacterRegularEditPermission
from ...serializers import CharacterDetailSerializer, CharacterRegularUpdateSerializer
from ..common import detail_or_update


def character_regular_update(request, character):
    """Update the narrow, player-writable field set for a PC."""
    response = detail_or_update(
        request, character, CharacterRegularEditPermission,
        CharacterRegularUpdateSerializer, CharacterDetailSerializer,
        detail_context={'request': request},
    )
    response['X-Skip-Cache'] = 'true'
    return response
