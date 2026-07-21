"""View for listing a game's documents."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; hidden documents are excluded below.
@permission_classes([AllowAny])
def game_documents(request, game_slug):
    """Return a paginated list of non-hidden documents for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    documents = game.documents.filter(hidden=False)
    return paginated_list_response(request, documents, GameDocumentListSerializer)
