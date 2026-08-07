"""View for the game document photo set (display) endpoint."""

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission

from ...models import Game, GameDocument


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_document_photo_set(request, game_slug, document_id, photo_id):
    """Update roles on a game document's photo (e.g. mark it as the display photo)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'photo_upload',
    )
    if error_response:
        return error_response

    photo = document.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    if 'display' in (request.data.get('roles') or []):
        document.photo = photo
        document.save()

    return Response(status=200)
