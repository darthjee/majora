"""View for retrieving any document (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models import Game
from ...serializers import GameDocumentDetailFullSerializer
from ..common import check_game_edit


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_document_detail_full(request, game_slug, document_id):
    """Return detail for any document (including hidden) in a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    response = Response(GameDocumentDetailFullSerializer(document).data)
    response['X-Skip-Cache'] = 'true'
    return response
