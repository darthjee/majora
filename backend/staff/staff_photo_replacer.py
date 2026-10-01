"""Staff photo replace initiation: creates a staff `Upload` for an existing photo row."""

import os

from django.db import transaction
from rest_framework.response import Response

from games.serializers import PhotoUploadSerializer
from games.views.common import validated_or_error
from uploads.models import Upload

_PATH_MISSING = {'errors': {'path': ['photo_path_missing']}}
_IN_PROGRESS = {'errors': {'upload': ['replace_in_progress']}}


class StaffPhotoReplacer:
    """Validates a replace request and creates the staff `Upload` linked to the photo.

    The target path keeps the photo's stored stem and takes the new file's lowercased
    extension; the client's filename stem is ignored. The photo row itself is untouched.
    """

    def __init__(self, request, photo_type, photo):
        """Store the request, the registry entry and the photo being replaced."""
        self._request = request
        self._photo_type = photo_type
        self._photo = photo

    def run(self):
        """Validate the request and return the init (201) or error Response."""
        serializer = PhotoUploadSerializer(data=self._request.data)
        error_response = validated_or_error(serializer)
        if error_response:
            return error_response
        if not self._photo.path:
            return Response(_PATH_MISSING, status=422)
        return self._create_upload(serializer.validated_data['filename'])

    def _create_upload(self, filename):
        """Lock the photo, refuse when a replace is in flight, else create the upload."""
        with transaction.atomic():
            photo = self._photo_type.model.objects.select_for_update().get(pk=self._photo.pk)
            if Upload.objects.active().for_object(photo).exists():
                return Response(_IN_PROGRESS, status=409)
            upload = Upload.objects.create(
                user=self._request.user,
                file_path=self.target_path(photo.path, filename),
                upload_type=Upload.UPLOAD_TYPE_IMAGE,
                origin=Upload.ORIGIN_STAFF,
                content_object=photo,
            )
        return self._response(upload, photo)

    def _response(self, upload, photo):
        """Return the 201 init response, mirroring `UploadInitiator`'s shape."""
        return Response(
            {
                'upload_id': upload.id,
                'token': upload.token,
                'upload_type': upload.upload_type,
                'id': photo.pk,
                'photo_type': self._photo_type.slug,
            },
            status=201,
        )

    @staticmethod
    def target_path(current_path, filename):
        """Return the current path's stem with the filename's lowercased extension."""
        stem, _ = os.path.splitext(current_path)
        _, extension = os.path.splitext(filename)
        return f'{stem}{extension.lower()}'
