"""View for the game document photos-list endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GameDocumentPhotoSerializer
from ..common import paginated_list_response


@api_view(['GET'])
# AllowAny: GET is intentionally public (hidden documents excluded below).
@permission_classes([AllowAny])
def game_document_photos(request, game_slug, document_id):
    """Return a paginated list of ready photos for a specific non-hidden game document."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    photos = document.photos.filter(ready=True)
    return paginated_list_response(request, photos, GameDocumentPhotoSerializer)
