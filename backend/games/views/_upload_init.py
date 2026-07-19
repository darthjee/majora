"""Shared helper for the photo/upload initiation endpoints (issue #690)."""

from rest_framework.response import Response

from ..models import Upload
from ..serializers import PhotoUploadSerializer
from .common import validated_or_error


class UploadInitiator:
    """Validate an upload-init request and create the `Upload` plus its owning photo record."""

    def __init__(self, request, build_file_path, create_photo, id_field, id_value):
        """Store the request and the per-endpoint hooks used to build the init response.

        `build_file_path(filename)` derives the storage path; `create_photo(file_path)`
        creates (or updates) the owning photo record. `id_field`/`id_value` name the
        endpoint-specific id (e.g. `character_id`) included in the response payload.
        """
        self._request = request
        self._build_file_path = build_file_path
        self._create_photo = create_photo
        self._id_field = id_field
        self._id_value = id_value

    def run(self):
        """Validate the payload, create the Upload/photo, and return the init Response."""
        serializer = PhotoUploadSerializer(data=self._request.data)
        error_response = validated_or_error(serializer)
        if error_response:
            return error_response

        filename = serializer.validated_data['filename']
        file_path = self._build_file_path(filename)
        photo = self._create_photo(file_path)

        return self._create_upload_response(photo, file_path)

    def _create_upload_response(self, photo, file_path):
        """Create the Upload record linked to `photo` and return the init response."""
        upload = Upload.objects.create(user=self._request.user, file_path=file_path)
        upload.content_object = photo
        upload.save()

        return Response(
            {'upload_id': upload.id, 'token': upload.token, self._id_field: self._id_value},
            status=201,
        )
