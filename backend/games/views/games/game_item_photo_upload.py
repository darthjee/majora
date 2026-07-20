"""View for the game item photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameItem, GameItemPhoto
from ...permissions import GameItemPhotoUploadPermission
from .._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_item_photo_upload(request, game_slug, item_id):
    """Initialise a game item photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    item = get_object_or_404(GameItem, pk=item_id, game=game)

    error_response = GameItemPhotoUploadPermission.check(request, game)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, item_id, filename),
        create_photo=lambda file_path: _reuse_or_create_photo(item, file_path),
        id_field='item_id',
        id_value=item.id,
    )
    return initiator.run()


def _build_file_path(game_slug, item_id, filename):
    """Fixed, deterministic path — a GameItem has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    return f'photos/games/{game_slug}/items/{item_id}/photo{ext}'


def _reuse_or_create_photo(item, file_path):
    """Return the item's existing GameItemPhoto updated with `file_path`, or a new one."""
    if item.photo_id is not None:
        photo = item.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return GameItemPhoto.objects.create(game_item=item, path=file_path, ready=False)
