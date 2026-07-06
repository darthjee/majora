"""View for listing a PC's treasures."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Character, Game
from ...serializers import CharacterTreasureSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: this is a read-only endpoint that returns a public list of treasures for a
# given PC; no user-specific data is exposed and there are no write operations.
@permission_classes([AllowAny])
def game_pc_treasures(request, game_slug, character_id):
    """Return a paginated list of treasures held by a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)
    treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
    return paginated_list_response(request, treasures, CharacterTreasureSerializer)
