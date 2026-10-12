"""Builders of the hard-link uploads created when a game-content copy carries photos.

`CoverPhotoLinkBuilder` handles a copy's cover photo: the single `photo<ext>` photo (no uuid)
of items, common items, possessions and factions. Gallery and file variants are left to their
tabs. Paths are always built server-side from the target game and the copy, never from request
data.
"""

import os

from uploads.models import Upload
from uploads.photo_path import PhotoPathBuilder


class CoverPhotoLinkBuilder:
    """Creates the pending cover photo row of a copy and its copy-origin `Upload`."""

    def __init__(self, owner_field, user):
        """Store the photo model's FK name to its owner and the user the link is issued to."""
        self._owner_field = owner_field
        self._user = user

    def build(self, source_photo, copy, segments):
        """Return the cover link `Upload` of `copy`, or None when `source_photo` is not ready.

        `segments` are the target path segments before the file name (e.g.
        `['games', target_slug, 'items', copy.id]`), so `copy` must already be saved.
        """
        if source_photo is None or not source_photo.ready:
            return None
        path = self._target_path(source_photo, segments)
        photo = self._create_photo(source_photo, copy, path)
        return self._create_upload(source_photo, photo)

    @staticmethod
    def _target_path(source_photo, segments):
        """Return the copy's `photos/.../photo<ext>` path, keeping the source extension."""
        ext = os.path.splitext(source_photo.path)[1]
        return PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False).build(root='photos')

    def _create_photo(self, source_photo, copy, path):
        """Create the copy's not-ready photo row, of the source's model, at `path`."""
        return type(source_photo).objects.create(
            path=path, ready=False, **{self._owner_field: copy},
        )

    def _create_upload(self, source_photo, photo):
        """Create the pending copy-origin cover `Upload` linking `source_photo` to `photo`."""
        return Upload.objects.create(
            user=self._user,
            origin=Upload.ORIGIN_COPY,
            status=Upload.STATUS_PENDING,
            upload_type=Upload.UPLOAD_TYPE_IMAGE,
            source_path=source_photo.path,
            file_path=photo.path,
            is_cover=True,
            content_object=photo,
        )
