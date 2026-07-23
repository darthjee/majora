"""View for the treasure photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Treasure, TreasurePhoto
from ...permissions import GameEditPermission, TreasureEditPermission
from ...photo_path import PhotoPathBuilder
from .._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def treasure_photo_upload(request, treasure_id):
    """Initialise a treasure photo upload and return the upload id and token."""
    treasure = get_object_or_404(Treasure, pk=treasure_id)

    error_response = _check_photo_permission(request, treasure)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(treasure_id, filename),
        create_photo=lambda file_path: _reuse_or_create_photo(treasure, file_path),
        id_field='treasure_id',
        id_value=treasure.id,
    )
    return initiator.run()


def _check_photo_permission(request, treasure):
    """Check edit permission via the treasure's owning game (if any), else the treasure itself."""
    if treasure.game_id is not None:
        return GameEditPermission.check(request, treasure.game)
    return TreasureEditPermission.check(request, treasure)


def _build_file_path(treasure_id, filename):
    """Derive the fixed storage path for the upload from the treasure id and filename.

    Unlike other photo upload endpoints, the path is deterministic (no random
    stem) because a treasure has at most one photo, which is always replaced.
    """
    _, ext = os.path.splitext(filename)
    return PhotoPathBuilder(['treasures', treasure_id], f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(treasure, file_path):
    """Return the treasure's existing TreasurePhoto updated with `file_path`, or a new one."""
    if treasure.photo_id is not None:
        treasure_photo = treasure.photo
        treasure_photo.path = file_path
        treasure_photo.ready = False
        treasure_photo.save()
        return treasure_photo
    return TreasurePhoto.objects.create(treasure=treasure, path=file_path, ready=False)
