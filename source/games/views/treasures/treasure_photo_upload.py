"""View for the treasure photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Treasure, TreasurePhoto, Upload
from ...permissions import TreasureEditPermission
from ...serializers import PhotoUploadSerializer
from ..common import validated_or_error


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def treasure_photo_upload(request, treasure_id):
    """Initialise a treasure photo upload and return the upload id and token."""
    treasure = get_object_or_404(Treasure, pk=treasure_id)

    error_response = TreasureEditPermission.check(request, treasure)
    if error_response:
        return error_response

    serializer = PhotoUploadSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    filename = serializer.validated_data['filename']
    file_path = _build_file_path(treasure_id, filename)
    treasure_photo = _reuse_or_create_photo(treasure, file_path)

    return _create_upload(request.user, treasure, treasure_photo, file_path)


def _build_file_path(treasure_id, filename):
    """Derive the fixed storage path for the upload from the treasure id and filename.

    Unlike other photo upload endpoints, the path is deterministic (no random
    stem) because a treasure has at most one photo, which is always replaced.
    """
    _, ext = os.path.splitext(filename)
    return f'photos/treasures/{treasure_id}/photo{ext}'


def _reuse_or_create_photo(treasure, file_path):
    """Return the treasure's existing TreasurePhoto updated with `file_path`, or a new one."""
    if treasure.photo_id is not None:
        treasure_photo = treasure.photo
        treasure_photo.path = file_path
        treasure_photo.ready = False
        treasure_photo.save()
        return treasure_photo
    return TreasurePhoto.objects.create(treasure=treasure, path=file_path, ready=False)


def _create_upload(user, treasure, treasure_photo, file_path):
    """Create the Upload record linked to `treasure_photo` and return the init response."""
    upload = Upload.objects.create(user=user, file_path=file_path)
    upload.content_object = treasure_photo
    upload.save()

    return Response(
        {'upload_id': upload.id, 'token': upload.token, 'treasure_id': treasure.id}, status=201
    )
