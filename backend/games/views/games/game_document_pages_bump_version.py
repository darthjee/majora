"""Views for batch-bumping the version of a document's untouched pages — regular/restricted."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission

from ...models import Game
from ...serializers import GameDocumentPagesBumpVersionSerializer
from ..common import check_game_edit, validated_or_error
from ._document_page_saga import archive_page


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline via EndpointPermission.check(), so an
# unauthenticated/unauthorized caller gets the app's own 401/403 payload instead of DRF's
# default.
@permission_classes([AllowAny])
def game_document_pages_bump_version(request, game_slug, document_id):
    """Bump the version of every untouched page of a non-hidden document — regular tier."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'page_edit',
    )
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return _bump_version(document, request)


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via check_game_edit(),
# so an unauthenticated/non-DM caller gets the app's own 401/403 payload instead of DRF's
# default.
@permission_classes([AllowAny])
def game_document_pages_bump_version_all(request, game_slug, document_id):
    """Bump the version of every untouched page of any document, incl. hidden — restricted."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    document = get_object_or_404(game.documents.all(), id=document_id)
    response = _bump_version(document, request)
    response['X-Skip-Cache'] = 'true'
    return response


def _bump_version(document, request):
    """Validate the payload, then archive and bump the version of every non-excluded page."""
    serializer = GameDocumentPagesBumpVersionSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    version = serializer.validated_data['version']
    exclude_ids = serializer.validated_data['exclude_ids']
    for page in document.pages.exclude(id__in=exclude_ids):
        archive_page(page)
        page.version = version
        page.save()
    return Response(status=200)
