"""View for retrieving a single non-hidden document, or updating any, in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import Game
from ...serializers import (
    GameDocumentDetailFullSerializer,
    GameDocumentDetailSerializer,
    GameDocumentUpdateSerializer,
)
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
# AllowAny: GET is intentionally public (hidden documents excluded below); PATCH
# authorization is enforced inline via EndpointPermission.check().
@permission_classes([AllowAny])
def game_document_detail(request, game_slug, document_id):
    """Return detail for, or update, a single document belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_document(request, game, document_id)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return Response(GameDocumentDetailSerializer(document).data)


def _update_document(request, game, document_id):
    """Check edit permission, validate the payload, persist it, and return the document."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'edit',
    )
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.all(), id=document_id)
    serializer = GameDocumentUpdateSerializer(document, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameDocumentDetailFullSerializer(document).data)
