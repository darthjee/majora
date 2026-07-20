"""Shared implementation for the character photo upload-init endpoints."""

import os
import uuid

from ...models import CharacterPhoto
from ...permissions import CharacterPhotoUploadPermission
from .._upload_init import UploadInitiator
from ._shared import _get_character_or_404


def character_photo_upload(request, game, game_slug, character_id, npc):
    """Initialise a character photo upload and return the upload id and token."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterPhotoUploadPermission.check(request, character)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, character_id, filename),
        create_photo=lambda file_path: CharacterPhoto.objects.create(
            character=character, path=file_path, ready=False
        ),
        id_field='character_id',
        id_value=character.id,
    )
    return initiator.run()


def _build_file_path(game_slug, character_id, filename):
    """Derive the storage path for the upload from the game slug, character id, and filename.

    `filename` is expected to be a sanitised basename (no directory components),
    as produced by PhotoUploadSerializer.validate_filename.
    """
    stem, ext = os.path.splitext(filename)
    random_uuid = uuid.uuid4()
    return f'photos/games/{game_slug}/characters/{character_id}/{stem}_{random_uuid}{ext}'
