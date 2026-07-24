"""View for listing a game's documents."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentListSerializer
from ..common import paginated_list_response
from ._document_create import game_document_create


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# GameDocumentCreatePermission.check().
@permission_classes([AllowAny])
def game_documents(request, game_slug):
    """Return a paginated list of non-hidden documents for a game, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_document_create(request, game)
    documents = game.documents.filter(hidden=False)
    return paginated_list_response(request, documents, GameDocumentListSerializer)
