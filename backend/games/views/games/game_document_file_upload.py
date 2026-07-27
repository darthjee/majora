"""View for the game document file upload init endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameDocument, GameDocumentFile, Upload
from ...permissions import GameDocumentFileUploadPermission
from ...photo_path import PhotoPathBuilder
from ...serializers import FileUploadSerializer
from .._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_document_file_upload(request, game_slug, document_id):
    """Initialise a game document file upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)

    error_response = GameDocumentFileUploadPermission.check(request, game)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, document_id, filename),
        create_photo=lambda file_path, data: GameDocumentFile.objects.create(
            game_document=document, path=file_path, ready=False,
            name=data.get('name') or data['filename'],
        ),
        id_field='document_id',
        id_value=document.id,
        serializer_class=FileUploadSerializer,
        upload_type=Upload.UPLOAD_TYPE_FILE,
    )
    return initiator.run()


def _build_file_path(game_slug, document_id, filename):
    """Derive the storage path, uuid-suffixed since a document can have many files."""
    segments = ['games', game_slug, 'documents', document_id]
    return PhotoPathBuilder(segments, filename, use_uuid=True).build(root='files')
