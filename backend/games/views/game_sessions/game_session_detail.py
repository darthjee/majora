"""View for retrieving or updating a single game session's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameSession
from ...permissions import GameSessionEditPermission
from ...serializers import GameSessionDetailSerializer, GameSessionUpdateSerializer
from ..common import detail_or_update


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authentication/authorisation is
# enforced inline in detail_or_update via GameSessionEditPermission.check().
@permission_classes([AllowAny])
def game_session_detail(request, game_slug, session_id):
    """Return or update detail for a specific session of the given game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    session = get_object_or_404(GameSession, id=session_id, game=game)

    return detail_or_update(
        request, session, GameSessionEditPermission, GameSessionUpdateSerializer,
        GameSessionDetailSerializer, detail_context={'request': request},
    )
