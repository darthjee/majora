"""View for retrieving a single non-hidden item belonging to a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameItemDetailSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; hidden items are excluded below.
@permission_classes([AllowAny])
def game_item_detail(request, game_slug, item_id):
    """Return detail for a single non-hidden item belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    item = get_object_or_404(game.items.filter(hidden=False), id=item_id)
    return Response(GameItemDetailSerializer(item).data)
