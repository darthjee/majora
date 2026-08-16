"""Shared implementation for bulk-trimming a GameDocumentPage set — regular and restricted twins.

Dispatched from `game_document_pages`/`game_document_pages_all` (issue #1129), which already
own the `pages.json`/`pages/all.json` URLs shared with the read side.
"""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from permissions import EndpointPermission

from ...serializers import GameDocumentPagesTrimSerializer
from ..common import check_game_edit, validated_or_error
from ._document_page_saga import archive_page


def game_document_pages_trim(request, game, document_id):
    """Delete pages past `keep` for a non-hidden document — regular tier (staff/player)."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'page_edit',
    )
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return _trim_pages(document, request)


def game_document_pages_trim_all(request, game, document_id):
    """Delete pages past `keep` for any document, including hidden — restricted tier."""
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.all(), id=document_id)
    response = _trim_pages(document, request)
    response['X-Skip-Cache'] = 'true'
    return response


def _trim_pages(document, request):
    """Validate the payload, then archive and delete every page of `document` past `keep`."""
    serializer = GameDocumentPagesTrimSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    keep = serializer.validated_data['keep']
    for page in document.pages.filter(order__gt=keep):
        archive_page(page)
        page.delete()
    return Response(status=204)
