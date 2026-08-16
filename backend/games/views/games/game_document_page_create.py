"""Shared implementation for creating a GameDocumentPage — regular and restricted twins.

Dispatched from `game_document_pages`/`game_document_pages_all` (issue #1129), which already
own the `pages.json`/`pages/all.json` URLs shared with the read side.
"""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import GameDocumentPage
from ...serializers import GameDocumentPageCreateSerializer, GameDocumentPageListSerializer
from ..common import check_game_edit, validated_or_error


def game_document_page_create(request, game, document_id):
    """Create a page for a non-hidden document — regular tier (staff/player)."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'page_edit',
    )
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return _create_page(document, request)


def game_document_page_create_all(request, game, document_id):
    """Create a page for any document, including hidden — restricted tier (DM/admin only)."""
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.all(), id=document_id)
    response = _create_page(document, request)
    response['X-Skip-Cache'] = 'true'
    return response


def _create_page(document, request):
    """Validate the payload and create a new GameDocumentPage for `document`."""
    serializer = GameDocumentPageCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    page = GameDocumentPage.objects.create(game_document=document, **serializer.validated_data)
    return Response(GameDocumentPageListSerializer(page).data, status=201)
