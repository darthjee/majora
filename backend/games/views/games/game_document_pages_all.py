"""View for the game document pages/all.json endpoint: list/create/trim — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentPageListSerializer
from ..common import check_game_edit, paginated_list_response
from .game_document_page_create import game_document_page_create_all
from .game_document_pages_trim import game_document_pages_trim_all


@api_view(['GET', 'POST', 'DELETE'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check()/check_game_edit(), so unauthenticated/non-DM callers get the
# app's own 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_document_pages_all(request, game_slug, document_id):
    """List, create, or bulk-trim pages (including for hidden documents) — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_document_page_create_all(request, game, document_id)
    if request.method == 'DELETE':
        return game_document_pages_trim_all(request, game, document_id)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    pages = document.pages.all()
    response = paginated_list_response(request, pages, GameDocumentPageListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
