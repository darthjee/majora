"""View for the photo upload initialisation endpoint."""

import os
import uuid

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Game, GamePhoto, Upload
from ..permissions import GameEditPermission


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def photo_upload(request, game_slug):
    """Initialise a game photo upload, returning the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = GameEditPermission.check(request, game)
    if error_response is not None:
        return error_response

    filename = request.data.get('filename', '')
    if not filename:
        return Response({'errors': {'filename': ['this field is required']}}, status=400)

    file_path = _build_file_path(game_slug, filename)
    upload = Upload.objects.create(user=request.user, file_path=file_path)
    GamePhoto.objects.create(game=game, path=file_path, ready=False)

    return Response({'id': upload.id, 'token': upload.token}, status=201)


def _build_file_path(game_slug, filename):
    """Return the pre-computed relative file path for the uploaded photo."""
    stem, ext = os.path.splitext(filename)
    unique_id = uuid.uuid4()
    return f'photos/games/{game_slug}/{stem}_{unique_id}{ext}'
