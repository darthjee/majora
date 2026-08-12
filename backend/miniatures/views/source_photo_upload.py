"""View for the source photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication
from games.views.common import require_staff
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ..models import Source, SourcePhoto
from ._shared import skip_cache


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def source_photo_upload(request, source_id):
    """Initialise a source photo upload and return the upload id and token."""
    source = get_object_or_404(Source, pk=source_id)

    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(source_id, filename),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(source, file_path),
        id_field='source_id',
        id_value=source.id,
    )
    return skip_cache(initiator.run())


def _build_file_path(source_id, filename):
    """Derive the fixed storage path for the upload from the source id and filename.

    The path is deterministic (no random stem) because a `Source` has at most one
    photo, which is always replaced.
    """
    _, ext = os.path.splitext(filename)
    return PhotoPathBuilder(['sources', source_id], f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(source, file_path):
    """Return the source's existing `SourcePhoto` updated with `file_path`, or a new one."""
    if source.photo_id is not None:
        source_photo = source.photo
        source_photo.path = file_path
        source_photo.ready = False
        source_photo.save()
        return source_photo
    return SourcePhoto.objects.create(source=source, path=file_path, ready=False)
