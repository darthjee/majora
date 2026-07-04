"""View for the upload finalize endpoint."""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..authentication import CookieTokenAuthentication
from ..models import CharacterPhoto, TreasurePhoto, Upload
from ..permissions import CharacterEditPermission, GameEditPermission, TreasureEditPermission

_FORBIDDEN = Response(status=status.HTTP_403_FORBIDDEN)
_VALID_STATUSES = {Upload.STATUS_UPLOADING, Upload.STATUS_UPLOADED}


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
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
    return _check_permission(request, upload)


def _token_matches(request, upload):
    """Return True if the X-Upload-Token header matches the upload token."""
    return request.META.get('HTTP_X_UPLOAD_TOKEN') == upload.token


def _is_expired(upload):
    """Return True if the upload's expiration time has passed."""
    return timezone.now() >= upload.expiration_time


def _check_permission(request, upload):
    """Return a permission error Response if the user may not edit the upload target, else None."""
    content_object = upload.content_object
    if isinstance(content_object, TreasurePhoto):
        return TreasureEditPermission.check(request, content_object.treasure)
    if isinstance(content_object, CharacterPhoto):
        return CharacterEditPermission.check(request, content_object.character)
    return GameEditPermission.check(request, content_object.game)


def _build_response(upload, new_status):
    """Return the appropriate success Response for the given status transition."""
    if new_status == Upload.STATUS_UPLOADING:
        return Response({'file_path': upload.file_path}, status=200)
    _mark_content_object_ready(upload)
    return Response(status=200)


def _mark_content_object_ready(upload):
    """Set the upload's content object to ready and persist it, updating its owner's photo."""
    content_object = upload.content_object
    content_object.ready = True
    content_object.save()
    if isinstance(content_object, TreasurePhoto):
        _set_treasure_photo(content_object)
    elif isinstance(content_object, CharacterPhoto):
        _set_profile_photo_if_unset(content_object)
    else:
        _set_cover_photo_if_unset(content_object)


def _set_cover_photo_if_unset(game_photo):
    """Set the game's cover photo to `game_photo` if it does not already have one."""
    game = game_photo.game
    if game.cover_photo_id is None:
        game.cover_photo = game_photo
        game.save()


def _set_profile_photo_if_unset(character_photo):
    """Set the character's profile photo to `character_photo` if it does not already have one."""
    character = character_photo.character
    if character.profile_photo_id is None:
        character.profile_photo = character_photo
        character.save()


def _set_treasure_photo(treasure_photo):
    """Set the treasure's photo to `treasure_photo`, always replacing any existing one."""
    treasure = treasure_photo.treasure
    treasure.photo = treasure_photo
    treasure.save()
