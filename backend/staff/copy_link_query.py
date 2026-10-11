"""Queries behind the staff pending-links list (`GET staff/copies/links.json`)."""

from functools import reduce
from operator import or_

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

from uploads.models import Upload

from . import copy_links


class PendingCopyLinks:
    """The not-yet-linked copy uploads (pending, uploading, failed or expired) of a game.

    `UploadQuerySet.active()` is deliberately not used: failed and expired links must be listed
    so they can be retried. Uploads whose copied row is gone drop out, since each entry's
    `object_ids_in` only yields existing rows of the game.
    """

    def __init__(self, game):
        """Store the target game."""
        self._game = game

    def uploads(self):
        """Return the game's copy uploads not yet `uploaded`, ordered by id."""
        return list(
            Upload.objects.filter(origin=Upload.ORIGIN_COPY)
            .filter(self._reach())
            .exclude(status=Upload.STATUS_UPLOADED)
            .order_by('id')
        )

    def _reach(self):
        """Return the `Q` matching uploads linked to any copyable row of the game."""
        return reduce(or_, (self._entry_reach(entry) for entry in copy_links.COPY_LINKS))

    def _entry_reach(self, entry):
        """Return the `Q` matching uploads linked to `entry`'s rows of the game."""
        return Q(
            content_type=ContentType.objects.get_for_model(entry.model),
            object_id__in=entry.object_ids_in(self._game),
        )


class CopyLinkEntities:
    """Describes the copied entity of each upload, batch-loading rows per model."""

    def __init__(self, uploads):
        """Store the uploads to describe."""
        self._uploads = uploads

    def load(self):
        """Return `{upload_id: entity_description_or_None}`."""
        entities = {}
        for entry, uploads in self._group_by_entry().items():
            entities.update(self._describe(entry, uploads))
        return entities

    def _group_by_entry(self):
        """Return `{copy_link_entry: [uploads]}` grouped by the uploads' content type."""
        groups = {}
        for upload in self._uploads:
            groups.setdefault(self._entry_for(upload), []).append(upload)
        return groups

    @staticmethod
    def _entry_for(upload):
        """Return the copy-link entry of the upload's content type."""
        model = ContentType.objects.get_for_id(upload.content_type_id).model_class()
        return copy_links.find_for_model(model)

    @staticmethod
    def _describe(entry, uploads):
        """Return `{upload_id: description}` for uploads of one entry, in two queries at most."""
        rows = entry.load_rows(upload.object_id for upload in uploads)
        by_row = entry.describe_rows(rows)
        return {upload.pk: by_row.get(upload.object_id) for upload in uploads}
