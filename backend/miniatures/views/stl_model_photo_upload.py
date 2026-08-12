"""View for the STL model photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication
from games.views.common import require_staff
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ..models import StlModel, StlModelPhoto
from ._shared import skip_cache


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def stl_model_photo_upload(request, stl_model_id):
    """Initialise an STL model photo upload and return the upload id and token."""
    stl_model = get_object_or_404(StlModel, pk=stl_model_id)

    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(stl_model_id, filename),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(stl_model, file_path),
        id_field='stl_model_id',
        id_value=stl_model.id,
    )
    return skip_cache(initiator.run())


def _build_file_path(stl_model_id, filename):
    """Derive the fixed storage path for the upload from the STL model id and filename.

    The path is deterministic (no random stem) because an `StlModel` has at most one
    photo, which is always replaced.
    """
    _, ext = os.path.splitext(filename)
    return PhotoPathBuilder(['stl_models', stl_model_id], f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(stl_model, file_path):
    """Return the STL model's existing `StlModelPhoto` updated with `file_path`, or a new one."""
    if stl_model.photo_id is not None:
        stl_model_photo = stl_model.photo
        stl_model_photo.path = file_path
        stl_model_photo.ready = False
        stl_model_photo.save()
        return stl_model_photo
    return StlModelPhoto.objects.create(stl_model=stl_model, path=file_path, ready=False)
