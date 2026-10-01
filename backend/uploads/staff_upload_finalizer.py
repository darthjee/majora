"""Finalize branch for staff-initiated (`origin='staff'`) photo replace uploads."""

from django.db import transaction
from rest_framework.response import Response

from games.views.common import require_staff
from staff import photo_types
from staff.cache_clear_header import attach_photo_cache_clear

from .models import Upload


class StaffUploadFinalizer:
    """Authorizes and applies the finalize of a staff replace upload.

    A staff replace rewrites the existing photo row's `path`/`ready` only: the per-type
    `mark_ready` handlers are skipped, so the owning entity's `photo` FK never changes.
    """

    def __init__(self, upload):
        """Store the staff upload being finalized."""
        self._upload = upload

    def check_permission(self, request):
        """Return 401/403 for non-staff, 404 `{cleanup_path}` if the photo is gone, else None."""
        error_response = require_staff(request)
        if error_response:
            return error_response
        if self._upload.content_object is None:
            return self._cleanup_response()
        return None

    def apply(self, new_status):
        """Persist the new status and, on `uploaded`, point the photo at the new file."""
        with transaction.atomic():
            self._upload.status = new_status
            self._upload.save()
            if new_status == Upload.STATUS_UPLOADING:
                return Response({'file_path': self._upload.file_path}, status=200)
            return self._replace_photo_path()

    def _replace_photo_path(self):
        """Lock the photo, swap in the uploaded path, mark it ready, and build the response."""
        photo = self._locked_photo()
        if photo is None:
            return self._cleanup_response()
        old_path = photo.path
        photo.path = self._upload.file_path
        photo.ready = True
        photo.save()
        return self._uploaded_response(photo, old_path)

    def _locked_photo(self):
        """Return the upload's photo row locked for update, or None if it was deleted."""
        model = self._upload.content_type.model_class()
        return model.objects.select_for_update().filter(pk=self._upload.object_id).first()

    def _uploaded_response(self, photo, old_path):
        """Return 200 with `previous_path` only when the stored path actually changed."""
        if old_path and old_path != self._upload.file_path:
            return self._path_changed_response(photo, old_path)
        return Response(status=200)

    @staticmethod
    def _path_changed_response(photo, old_path):
        """Return 200 `{previous_path}` with `X-Cache-Clear` listing the owner's cached paths."""
        photo_type = photo_types.find_for_model(type(photo))
        owner = photo_type.owner_of(photo) if photo_type else None
        response = Response({'previous_path': old_path}, status=200)
        return attach_photo_cache_clear(response, photo_type, owner)

    def _cleanup_response(self):
        """Return the 404 telling the proxy to remove the file it wrote for this upload."""
        return Response({'cleanup_path': self._upload.file_path}, status=404)
