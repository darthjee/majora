"""View for the PC treasure sell endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._shared import _get_character_or_404
from ._treasure_exchange import character_treasure_sell


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline inside character_treasure_sell via
# CharacterEditPermission.check().
@permission_classes([AllowAny])
def game_pc_treasure_sell(request, game_slug, character_id):
    """Sell a quantity of a treasure owned by a PC, refunding its value into money."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)

    return character_treasure_sell(request, game, character)
