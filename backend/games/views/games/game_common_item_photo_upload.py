"""View for the game common item photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from permissions import EndpointPermission
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ...models import Game, GameCommonItem, GameCommonItemPhoto


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def game_common_item_photo_upload(request, game_slug, common_item_id):
    """Initialise a game common item photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    common_item = get_object_or_404(GameCommonItem, pk=common_item_id, game=game)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_common_item', 'regular', 'photo_upload',
    )
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, common_item_id, filename),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(common_item, file_path),
        id_field='common_item_id',
        id_value=common_item.id,
    )
    return initiator.run()


def _build_file_path(game_slug, common_item_id, filename):
    """Fixed, deterministic path — a GameCommonItem has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    segments = ['games', game_slug, 'common_items', common_item_id]
    return PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(common_item, file_path):
    """Return the item's existing GameCommonItemPhoto updated with `file_path`, or new."""
    if common_item.photo_id is not None:
        photo = common_item.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return GameCommonItemPhoto.objects.create(
        game_common_item=common_item, path=file_path, ready=False,
    )
