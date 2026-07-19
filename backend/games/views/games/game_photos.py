"""View for listing a game's photos."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GamePhotoSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: this is a read-only endpoint that returns a public list of ready photos for a
# given game; no user-specific data is exposed and there are no write operations.
@permission_classes([AllowAny])
def game_photos(request, game_slug):
    """Return a paginated list of ready photos for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    photos = game.photos.filter(ready=True)
    return paginated_list_response(request, photos, GamePhotoSerializer)
