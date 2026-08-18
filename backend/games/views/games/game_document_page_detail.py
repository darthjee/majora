"""Views for updating a single GameDocumentPage — regular and restricted twins."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import Game
from ...serializers import GameDocumentPageListSerializer, GameDocumentPageUpdateSerializer
from ..common import check_game_edit, validated_or_error
from ._document_page_saga import archive_page


@api_view(['PATCH'])
# AllowAny: authorization is enforced inline via EndpointPermission.check(), so an
# unauthenticated/unauthorized caller gets the app's own 401/403 payload instead of DRF's
# default.
@permission_classes([AllowAny])
def game_document_page_detail(request, game_slug, document_id, page_id):
    """Update a single page belonging to a non-hidden document — regular tier (staff/player)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'page_edit',
    )
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return _update_page(document, page_id, request)


@api_view(['PATCH'])
# AllowAny: authorization for this whole endpoint is enforced inline via check_game_edit(),
# so an unauthenticated/non-DM caller gets the app's own 401/403 payload instead of DRF's
# default.
@permission_classes([AllowAny])
def game_document_page_detail_all(request, game_slug, document_id, page_id):
    """Update a single page of any document, including hidden — restricted tier (DM/admin)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.all(), id=document_id)
    response = _update_page(document, page_id, request)
    response['X-Skip-Cache'] = 'true'
    return response


def _update_page(document, page_id, request):
    """Validate the payload, archive the page's pre-save state, then apply the update."""
    page = get_object_or_404(document.pages.all(), id=page_id)
    serializer = GameDocumentPageUpdateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    archive_page(page)
    page.content = serializer.validated_data['content']
    page.version = serializer.validated_data['version']
    page.save()
    return Response(GameDocumentPageListSerializer(page).data)
