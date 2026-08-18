"""View for listing a game faction's non-hidden characters."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ._faction_characters import faction_characters


@api_view(['GET'])
@permission_classes([AllowAny])
def game_faction_characters(request, game_slug, faction_id):
    """Return a paginated list of non-hidden characters belonging to a faction.

    Public — `GameFaction` has no `hidden` concept of its own, so there's no faction-level 404
    gate here, only individual hidden characters are excluded. Sets no `X-Skip-Cache` header at
    all — its output is identical for every viewer, matching `game_documents`' regular-listing
    convention.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    faction = get_object_or_404(game.factions.all(), id=faction_id)
    return faction_characters(request, game, faction, allow_hidden=False)
