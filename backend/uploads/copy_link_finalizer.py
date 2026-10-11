"""Finalize branch for hard-link uploads created by a game content copy (`origin='copy'`)."""

from django.db import transaction
from rest_framework.response import Response

from games.views.common import require_staff
from staff import copy_links
from staff.cache_clear_header import attach_cache_clear

from .models import Upload

_ERRORS = frozenset(code for code, _ in Upload.ERROR_CHOICES)


class CopyLinkFinalizer:
    """Authorizes and applies the start, failure and finalize of a copy link upload.

    The copied row already carries its final `path`: finalizing only marks it ready and, for a
    cover copy, points the owner's cover `photo` FK at it. The per-type `mark_ready` handlers
    are skipped, as `StaffUploadFinalizer` does.
    """

    _HANDLERS = {
        Upload.STATUS_UPLOADING: '_start',
        Upload.STATUS_FAILED: '_fail',
        Upload.STATUS_UPLOADED: '_finalize',
    }

    def __init__(self, upload):
        """Store the copy upload being advanced."""
        self._upload = upload

    def check_permission(self, request):
        """Return 401/403 for non-staff callers, else None (replaces the per-type check)."""
        return require_staff(request)

    def apply(self, new_status, data):
        """Apply the `uploading`/`failed`/`uploaded` transition and return the Response."""
        with transaction.atomic():
            return getattr(self, self._HANDLERS[new_status])(data)

    def _start(self, data):
        """Mark the link in flight and return both ends of the link."""
        self._save_status(Upload.STATUS_UPLOADING)
        return Response(
            {'file_path': self._upload.file_path, 'source_path': self._upload.source_path},
            status=200,
        )

    def _fail(self, data):
        """Record the failure reason, or return 400 when it is missing or unknown."""
        error = data.get('error')
        if error not in _ERRORS:
            return Response({'errors': {'error': ['invalid_error']}}, status=400)
        self._upload.error = error
        self._save_status(Upload.STATUS_FAILED)
        return Response(status=200)

    def _finalize(self, data):
        """Mark the copied row ready, set the cover if needed, and list stale cache paths."""
        self._save_status(Upload.STATUS_UPLOADED)
        row = self._locked_row()
        if row is None:
            return Response(status=404)
        return self._mark_ready(row, copy_links.find_for_model(type(row)))

    def _mark_ready(self, row, entry):
        """Set `row` ready (and cover), returning 200 with the hook's `X-Cache-Clear` paths."""
        row.ready = True
        row.save()
        if self._upload.is_cover:
            entry.set_cover(row)
        return attach_cache_clear(Response(status=200), entry.cache_paths(row, self._upload))

    def _save_status(self, new_status):
        """Persist `new_status` on the upload."""
        self._upload.status = new_status
        self._upload.save()

    def _locked_row(self):
        """Return the copied row locked for update, or None if it was deleted."""
        model = self._upload.content_type.model_class()
        return model.objects.select_for_update().filter(pk=self._upload.object_id).first()
