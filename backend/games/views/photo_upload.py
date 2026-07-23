"""View for the photo upload init endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ..models import Game, GamePhoto
from ..permissions import GameEditPermission
from ..photo_path import PhotoPathBuilder
from ._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def photo_upload(request, game_slug):
    """Initialise a game photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, filename),
        create_photo=lambda file_path: GamePhoto.objects.create(
            game=game, path=file_path, ready=False
        ),
        id_field='game_id',
        id_value=game.id,
    )
    return initiator.run()


def _build_file_path(game_slug, filename):
    """Derive the storage path for the upload from the game slug and filename.

    `filename` is expected to be a sanitised basename (no directory components),
    as produced by PhotoUploadSerializer.validate_filename.
    """
    return PhotoPathBuilder(['games', game_slug], filename, use_uuid=True).build()
