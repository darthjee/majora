"""Shared implementation for the character item photo upload-init endpoints."""

import os

from django.shortcuts import get_object_or_404

from ...models import CharacterItemPhoto
from ...permissions import CharacterItemPhotoUploadPermission
from .._upload_init import UploadInitiator
from ._shared import _get_character_or_404


def character_item_photo_upload(request, game, game_slug, character_id, item_id, npc):
    """Initialise a character item photo upload and return the upload id and token."""
    character = _get_character_or_404(game, character_id, npc)
    item = get_object_or_404(character.character_items, pk=item_id)

    error_response = CharacterItemPhotoUploadPermission.check(request, character)
    if error_response:
        return error_response

    kind = 'npcs' if npc else 'pcs'
    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(
            game_slug, kind, character_id, item_id, filename,
        ),
        create_photo=lambda file_path: _reuse_or_create_photo(item, file_path),
        id_field='item_id',
        id_value=item.id,
    )
    return initiator.run()


def _build_file_path(game_slug, kind, character_id, item_id, filename):
    """Fixed, deterministic path — a CharacterItem has at most one photo override, always set."""
    _, ext = os.path.splitext(filename)
    return f'photos/games/{game_slug}/{kind}/{character_id}/items/{item_id}/photo{ext}'


def _reuse_or_create_photo(item, file_path):
    """Return the item's existing CharacterItemPhoto updated with `file_path`, or a new one."""
    if item.photo_id is not None:
        photo = item.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return CharacterItemPhoto.objects.create(character_item=item, path=file_path, ready=False)
