"""View for the upload finalize endpoint."""

from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Upload
from ..permissions import GameEditPermission

_FORBIDDEN = Response(status=status.HTTP_403_FORBIDDEN)
_VALID_STATUSES = {Upload.STATUS_UPLOADING, Upload.STATUS_UPLOADED}


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_finalize(request, upload_id):
    """Advance the upload lifecycle and optionally mark the linked object as ready."""
    upload = _find_upload(upload_id)
    if upload is None:
        return _FORBIDDEN

    error = _validate_upload(request, upload)
    if error:
        return error

    new_status = request.data.get('status')
    if new_status not in _VALID_STATUSES:
        return Response({'errors': {'status': ['invalid status']}}, status=400)

    upload.status = new_status
    upload.save()

    return _build_response(upload, new_status)


def _find_upload(upload_id):
    """Return the Upload with the given id, or None if not found."""
    return Upload.objects.filter(pk=upload_id).first()


def _validate_upload(request, upload):
    """Run all authorization checks and return a 403 Response on first failure, else None."""
    if not _token_matches(request, upload):
        return _FORBIDDEN
    if request.user != upload.user:
        return _FORBIDDEN
    if _is_expired(upload):
        return _FORBIDDEN
    if upload.status == Upload.STATUS_UPLOADED:
        return _FORBIDDEN
    return _check_game_permission(request, upload)


def _token_matches(request, upload):
    """Return True if the X-Upload-Token header matches the upload token."""
    return request.META.get('HTTP_X_UPLOAD_TOKEN') == upload.token


def _is_expired(upload):
    """Return True if the upload's expiration time has passed."""
    return timezone.now() >= upload.expiration_time


def _check_game_permission(request, upload):
    """Return a permission error Response if the user cannot edit the upload's game, else None."""
    game = upload.content_object.game
    return GameEditPermission.check(request, game)


def _build_response(upload, new_status):
    """Return the appropriate success Response for the given status transition."""
    if new_status == Upload.STATUS_UPLOADING:
        return Response({'file_path': upload.file_path}, status=200)
    _mark_content_object_ready(upload)
    return Response(status=200)


def _mark_content_object_ready(upload):
    """Set the upload's content object to ready and persist it."""
    content_object = upload.content_object
    content_object.ready = True
    content_object.save()
