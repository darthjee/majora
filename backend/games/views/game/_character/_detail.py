"""Shared implementation for the character detail (get-only) endpoint."""

from rest_framework.response import Response

from ....serializers import CharacterDetailSerializer
from ._decorators import check_hidden


@check_hidden
def character_detail(request, game, character, check_hidden):
    """Return detail for a specific character.

    When `check_hidden` is True, a hidden character is gated behind a 404 (carrying
    `X-Skip-Cache`). The plain NPC detail passes `public_view=True` (consumed by `check_hidden`),
    so that 404 applies to everyone, editors included (issue #1616): editors read a hidden NPC
    through the restricted `full.json` instead. A successful response therefore never carries a
    hidden character and is safely cacheable.
    """
    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)
