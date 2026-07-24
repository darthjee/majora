"""View for retrieving a single non-hidden document in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentDetailSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public (hidden documents excluded below).
@permission_classes([AllowAny])
def game_document_detail(request, game_slug, document_id):
    """Return detail for a single non-hidden document belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return Response(GameDocumentDetailSerializer(document).data)
