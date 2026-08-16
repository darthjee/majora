"""View for the game document pages-list endpoint: list, create, and bulk-trim pages."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentPageListSerializer
from ..common import paginated_list_response
from .game_document_page_create import game_document_page_create
from .game_document_pages_trim import game_document_pages_trim


@api_view(['GET', 'POST', 'DELETE'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public (hidden documents excluded below); POST/DELETE
# authorization is enforced inline via EndpointPermission.check().
@permission_classes([AllowAny])
def game_document_pages(request, game_slug, document_id):
    """List, create, or bulk-trim pages for a specific non-hidden game document."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_document_page_create(request, game, document_id)
    if request.method == 'DELETE':
        return game_document_pages_trim(request, game, document_id)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    pages = document.pages.all()
    return paginated_list_response(request, pages, GameDocumentPageListSerializer)
