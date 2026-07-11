"""View for listing all NPCs (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import CharacterFullListSerializer
from ..common import paginated_list_response
from ._shared import _filter_characters


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npcs_all(request, game_slug):
    """Return all NPCs (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    npcs = game.characters.filter(npc=True)
    npcs = _filter_characters(request, npcs, allegiance_field='allegiance', slain_field='slain')
    response = paginated_list_response(request, npcs, CharacterFullListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
