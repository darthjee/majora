"""View for the upload finalize endpoint."""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from games.models import (
    CharacterItemPhoto,
    CharacterPhoto,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPhoto,
    GameFactionPhoto,
    GameItemPhoto,
    GamePossessionPhoto,
    TreasurePhoto,
)
from games.views.common import check_game_edit, require_staff
from miniatures.models import CollectionPhoto, SourcePhoto, StlModelPhoto
from permissions import EndpointPermission

from .models import Upload

_FORBIDDEN = Response(status=status.HTTP_403_FORBIDDEN)
_VALID_STATUSES = {Upload.STATUS_UPLOADING, Upload.STATUS_UPLOADED}


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_finalize(request, upload_type, upload_id):
    """Advance the upload lifecycle and optionally mark the linked object as ready."""
    upload = _find_upload(upload_id)
    if upload is None:
        return _FORBIDDEN

    error = _validate_upload(request, upload)
    if error:
        return error

    if upload.upload_type != upload_type:
        return Response(status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in _VALID_STATUSES:
        return Response({'errors': {'status': ['invalid_status']}}, status=400)

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
    permission_check, _ = _handlers_for(content_object)
    return permission_check(request, content_object)


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
    _, mark_ready = _handlers_for(content_object)
    mark_ready(content_object)


def _set_game_photo_if_unset(game_photo):
    """Set the game's photo to `game_photo` if it does not already have one."""
    game = game_photo.game
    if game.photo_id is None:
        game.photo = game_photo
        game.save()


def _set_character_photo_if_unset(character_photo):
    """Set the character's photo to `character_photo` if it does not already have one."""
    character = character_photo.character
    if character.photo_id is None:
        character.photo = character_photo
        character.save()


def _set_document_photo_if_unset(document_photo):
    """Set the document's photo to `document_photo` if it does not already have one."""
    document = document_photo.game_document
    if document.photo_id is None:
        document.photo = document_photo
        document.save()


def _set_document_file_if_unset(document_file):
    """No-op ready marker for GameDocumentFile: it has no single "current file" slot to set.

    Kept as a distinct function (rather than reusing a shared no-op) to match this module's
    one-handler-per-entity convention alongside `_set_document_photo_if_unset`.
    """


def _set_document_file_photo_if_unset(document_file_photo):
    """No-op ready marker for GameDocumentFilePhoto: already assigned to its file at init time.

    Kept as a distinct function (rather than reusing a shared no-op) to match this module's
    one-handler-per-entity convention alongside `_set_document_file_if_unset`.
    """


def _set_treasure_photo(treasure_photo):
    """Set the treasure's photo to `treasure_photo`, always replacing any existing one."""
    treasure = treasure_photo.treasure
    treasure.photo = treasure_photo
    treasure.save()


def _set_stl_model_photo(stl_model_photo):
    """Set the STL model's photo to `stl_model_photo`, always replacing any existing one."""
    stl_model = stl_model_photo.stl_model
    stl_model.photo = stl_model_photo
    stl_model.save()


def _set_source_photo(source_photo):
    """Set the source's photo to `source_photo`, always replacing any existing one."""
    source = source_photo.source
    source.photo = source_photo
    source.save()


def _set_item_photo(item_photo):
    """Set the item's photo to `item_photo`, always replacing any existing one."""
    item = item_photo.game_item
    item.photo = item_photo
    item.save()


def _set_character_item_photo(item_photo):
    """Set the character item's photo to `item_photo`, always replacing any existing one."""
    item = item_photo.character_item
    item.photo = item_photo
    item.save()


def _set_possession_photo(possession_photo):
    """Set the possession's photo to `possession_photo`, always replacing any existing one."""
    possession = possession_photo.game_possession
    possession.photo = possession_photo
    possession.save()


def _set_faction_photo(faction_photo):
    """Set the faction's photo to `faction_photo`, always replacing any existing one."""
    faction = faction_photo.faction
    faction.photo = faction_photo
    faction.save()


def _set_collection_photo_if_unset(collection_photo):
    """No-op ready marker for CollectionPhoto: promotion to Collection.photo already happens
    at upload-init time (the first photo in the gallery), not at finalize.
    """


def _treasure_photo_permission(request, content_object):
    """Return a permission error Response for a TreasurePhoto content object, else None."""
    treasure = content_object.treasure
    action = 'edit' if treasure.game_id is None else 'edit_scoped'
    return EndpointPermission(request.user).check(request, 'treasure', 'restricted', action)


def _character_photo_permission(request, content_object):
    """Return a permission error Response for a CharacterPhoto content object, else None."""
    character = content_object.character
    resource = 'game_pc' if character.is_pc else 'game_npc'
    return EndpointPermission(request.user, game=character.game, pc=character).check(
        request, resource, 'regular', 'photo_upload',
    )


def _game_item_photo_permission(request, content_object):
    """Return a permission error Response for a GameItemPhoto content object, else None."""
    game = content_object.game_item.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_item', 'regular', 'photo_upload',
    )


def _game_possession_photo_permission(request, content_object):
    """Return a permission error Response for a GamePossessionPhoto content object, else None."""
    game = content_object.game_possession.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_possession', 'regular', 'photo_upload',
    )


def _faction_photo_permission(request, content_object):
    """Return a permission error Response for a GameFactionPhoto content object, else None."""
    game = content_object.faction.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_faction', 'regular', 'photo_upload',
    )


def _collection_photo_permission(request, content_object):
    """Return a permission error Response for a CollectionPhoto content object, else None.

    `Collection` has no owning-game/ownership concept -- creation and photo upload are both
    uniformly staff-only, so the same `require_staff` gate used by the upload-init endpoint
    applies here too.
    """
    return require_staff(request)


def _character_item_photo_permission(request, content_object):
    """Return a permission error Response for a CharacterItemPhoto content object, else None."""
    character = content_object.character_item.character
    resource = 'game_pc_item' if character.is_pc else 'game_npc_item'
    type_ = 'regular' if character.is_pc else 'restricted'
    return EndpointPermission(request.user, game=character.game, pc=character).check(
        request, resource, type_, 'photo_upload',
    )


def _document_photo_permission(request, content_object):
    """Return a permission error Response for a GameDocumentPhoto content object, else None."""
    game = content_object.game_document.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'photo_upload',
    )


def _document_file_permission(request, content_object):
    """Return a permission error Response for a GameDocumentFile content object, else None."""
    game = content_object.game_document.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'file_upload',
    )


def _document_file_photo_permission(request, content_object):
    """Return a permission error Response for a GameDocumentFilePhoto content object, else None."""
    try:
        file = GameDocumentFile.objects.get(photo=content_object)
    except (GameDocumentFile.DoesNotExist, GameDocumentFile.MultipleObjectsReturned):
        return _FORBIDDEN
    game = file.game_document.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'file_photo_upload',
    )


def _game_photo_permission(request, content_object):
    """Return a permission error Response for a GamePhoto (default) content object, else None."""
    return check_game_edit(request, content_object.game)


def _stl_model_photo_permission(request, content_object):
    """Return a permission error Response for a StlModelPhoto content object, else None.

    `StlModel` has no owning-game/ownership concept -- creation and photo upload are both
    uniformly staff-only, so the same `require_staff` gate used by the upload-init endpoint
    applies here too.
    """
    return require_staff(request)


def _source_photo_permission(request, content_object):
    """Return a permission error Response for a SourcePhoto content object, else None.

    `Source` has no owning-game/ownership concept -- creation and photo upload are both
    uniformly staff-only, so the same `require_staff` gate used by the upload-init endpoint
    applies here too.
    """
    return require_staff(request)


# Registry mapping each photo content-object type to its (permission_check, mark_ready) pair,
# replacing the previous per-entity isinstance dispatch chains. GamePhoto (and any other/default
# content object type) falls through to `_DEFAULT_HANDLERS`, matching prior behavior.
_PHOTO_HANDLERS = {
    TreasurePhoto: (_treasure_photo_permission, _set_treasure_photo),
    StlModelPhoto: (_stl_model_photo_permission, _set_stl_model_photo),
    SourcePhoto: (_source_photo_permission, _set_source_photo),
    CharacterPhoto: (_character_photo_permission, _set_character_photo_if_unset),
    GameItemPhoto: (_game_item_photo_permission, _set_item_photo),
    GamePossessionPhoto: (_game_possession_photo_permission, _set_possession_photo),
    GameFactionPhoto: (_faction_photo_permission, _set_faction_photo),
    CollectionPhoto: (_collection_photo_permission, _set_collection_photo_if_unset),
    CharacterItemPhoto: (_character_item_photo_permission, _set_character_item_photo),
    GameDocumentPhoto: (_document_photo_permission, _set_document_photo_if_unset),
    GameDocumentFile: (_document_file_permission, _set_document_file_if_unset),
    GameDocumentFilePhoto: (_document_file_photo_permission, _set_document_file_photo_if_unset),
}
_DEFAULT_HANDLERS = (_game_photo_permission, _set_game_photo_if_unset)


def _handlers_for(content_object):
    """Return the (permission_check, mark_ready) pair registered for `content_object`'s type."""
    return _PHOTO_HANDLERS.get(type(content_object), _DEFAULT_HANDLERS)
