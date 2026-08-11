"""View for the collection photo upload init endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication
from games.photo_path import PhotoPathBuilder
from games.views._upload_init import UploadInitiator
from games.views.common import require_staff

from ..models import Collection, CollectionPhoto
from ._shared import skip_cache


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def collection_photo_upload(request, collection_id):
    """Initialise a collection photo upload and return the upload id and token."""
    collection = get_object_or_404(Collection, pk=collection_id)

    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(collection_id, filename),
        create_photo=lambda file_path, _data: _create_photo(collection, file_path),
        id_field='collection_id',
        id_value=collection.id,
    )
    return skip_cache(initiator.run())


def _build_file_path(collection_id, filename):
    """Derive the storage path for the upload from the collection id and filename.

    Unlike `Source`'s fixed `photo{ext}` path, a UUID is appended to the filename stem
    (`use_uuid=True`) because multiple `CollectionPhoto` rows must coexist for the same
    collection instead of a single slot being replaced on every upload.
    """
    return PhotoPathBuilder(['collections', collection_id], filename, use_uuid=True).build()


def _create_photo(collection, file_path):
    """Create a new gallery `CollectionPhoto` row, promoting it to the main photo if unset.

    Every upload appends to the gallery (unlike `Source`'s single-slot replace-on-upload
    behaviour); the first upload for a collection also becomes its main `Collection.photo`,
    since there is nothing else to choose from yet. Later uploads only append -- they never
    change `Collection.photo`.
    """
    photo = CollectionPhoto.objects.create(collection=collection, path=file_path, ready=False)
    if collection.photo_id is None:
        collection.photo = photo
        collection.save()
    return photo
