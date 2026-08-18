"""View for the game possession photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from permissions import EndpointPermission
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ...models import Game, GamePossession, GamePossessionPhoto


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def game_possession_photo_upload(request, game_slug, possession_id):
    """Initialise a game possession photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    possession = get_object_or_404(GamePossession, pk=possession_id, game=game)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_possession', 'regular', 'photo_upload',
    )
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, possession_id, filename),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(possession, file_path),
        id_field='possession_id',
        id_value=possession.id,
    )
    return initiator.run()


def _build_file_path(game_slug, possession_id, filename):
    """Fixed, deterministic path — a GamePossession has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    segments = ['games', game_slug, 'possessions', possession_id]
    return PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(possession, file_path):
    """Return the possession's existing GamePossessionPhoto updated with `file_path`, or new."""
    if possession.photo_id is not None:
        photo = possession.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return GamePossessionPhoto.objects.create(
        game_possession=possession, path=file_path, ready=False,
    )
