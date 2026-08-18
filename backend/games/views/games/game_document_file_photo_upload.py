"""View for the game document file photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from permissions import EndpointPermission
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ...models import Game, GameDocument, GameDocumentFile, GameDocumentFilePhoto


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def game_document_file_photo_upload(request, game_slug, document_id, file_id):
    """Initialise a game document file's photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)
    file = get_object_or_404(GameDocumentFile, pk=file_id, game_document=document)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_document', 'regular', 'file_photo_upload',
    )
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(
            game_slug, document_id, file_id, filename,
        ),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(file, file_path),
        id_field='file_id',
        id_value=file.id,
    )
    return initiator.run()


def _build_file_path(game_slug, document_id, file_id, filename):
    """Fixed, deterministic path — a file has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    segments = ['games', game_slug, 'documents', document_id, 'files', file_id]
    return PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(file, file_path):
    """Return the file's existing GameDocumentFilePhoto updated with `file_path`, or a new one."""
    if file.photo_id is not None:
        photo = file.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    photo = GameDocumentFilePhoto.objects.create(path=file_path, ready=False)
    file.photo = photo
    file.save(update_fields=['photo'])
    return photo
