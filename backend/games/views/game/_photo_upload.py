"""Shared implementation for the character photo upload-init endpoints."""

import os
import uuid

from rest_framework.response import Response

from ...models import CharacterPhoto, Upload
from ...permissions import CharacterPhotoUploadPermission, NpcPlayerEditPermission
from ...serializers import PhotoUploadSerializer
from ..common import validated_or_error
from ._shared import _get_character_or_404


def character_photo_upload(request, game, game_slug, character_id, npc):
    """Initialise a character photo upload and return the upload id and token."""
    character = _get_character_or_404(game, character_id, npc)

    permission_class = NpcPlayerEditPermission if npc else CharacterPhotoUploadPermission
    error_response = permission_class.check(request, character)
    if error_response:
        return error_response

    serializer = PhotoUploadSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    filename = serializer.validated_data['filename']
    file_path = _build_file_path(game_slug, character_id, filename)

    return _create_upload(request.user, character, file_path)


def _build_file_path(game_slug, character_id, filename):
    """Derive the storage path for the upload from the game slug, character id, and filename.

    `filename` is expected to be a sanitised basename (no directory components),
    as produced by PhotoUploadSerializer.validate_filename.
    """
    stem, ext = os.path.splitext(filename)
    random_uuid = uuid.uuid4()
    return f'photos/games/{game_slug}/characters/{character_id}/{stem}_{random_uuid}{ext}'


def _create_upload(user, character, file_path):
    """Create the Upload and CharacterPhoto records and return the init response payload."""
    upload = Upload.objects.create(user=user, file_path=file_path)
    character_photo = CharacterPhoto.objects.create(
        character=character, path=file_path, ready=False
    )
    upload.content_object = character_photo
    upload.save()

    return Response(
        {'upload_id': upload.id, 'token': upload.token, 'character_id': character.id}, status=201
    )
