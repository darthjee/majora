"""View for the game document files/all.json endpoint — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import GameDocumentFileSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_document_files_all(request, game_slug, document_id):
    """Return all ready files (including for hidden documents) — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    files = document.files.filter(ready=True)
    response = paginated_list_response(request, files, GameDocumentFileSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
