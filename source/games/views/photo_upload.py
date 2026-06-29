"""View for the photo upload init endpoint."""

import os
import uuid

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..authentication import CookieTokenAuthentication
from ..models import Game, GamePhoto, Upload
from ..permissions import GameEditPermission
from ..serializers import PhotoUploadSerializer


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def photo_upload(request, game_slug):
    """Initialise a game photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = PhotoUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    filename = serializer.validated_data['filename']
    file_path = _build_file_path(game_slug, filename)

    upload = Upload.objects.create(user=request.user, file_path=file_path)
    game_photo = GamePhoto.objects.create(game=game, path=file_path, ready=False)
    upload.content_object = game_photo
    upload.save()

    return Response({'id': upload.id, 'token': upload.token}, status=201)


def _build_file_path(game_slug, filename):
    """Derive the storage path for the upload from the game slug and filename.

    `filename` is expected to be a sanitised basename (no directory components),
    as produced by PhotoUploadSerializer.validate_filename.
    """
    stem, ext = os.path.splitext(filename)
    random_uuid = uuid.uuid4()
    return f'photos/games/{game_slug}/{stem}_{random_uuid}{ext}'
