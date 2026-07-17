"""View for the PC money-only update endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from .....authentication import CookieTokenAuthentication
from .....models import Game
from ..._money import character_money_update
from ..._shared import _get_character_or_404


@api_view(['PUT'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline via CharacterMoneyEditPermission.check().
@permission_classes([AllowAny])
def game_pc_money(request, game_slug, character_id):
    """Update a PC's money through the narrow money-only endpoint."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)
    return character_money_update(request, character)
