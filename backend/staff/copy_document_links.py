"""Builders of the hard-link uploads created when a document copy carries photos and files.

A document owns several gallery photos (one of them the cover), several files and an optional
photo per file, so it needs builders the single fixed-name `CoverPhotoLinkBuilder` does not
cover. Every builder creates the copy's row with `ready=false` plus one pending copy-origin
`Upload`, skips not-ready sources, and builds paths server-side only.
"""

import os
import re

from games.models import GameDocumentFile, GameDocumentFilePhoto, GameDocumentPhoto
from uploads.models import Upload
from uploads.photo_path import PhotoPathBuilder

_UUID_SUFFIX_RE = re.compile(
    r'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
)


def source_filename(path):
    """Return the basename of `path` with its `_<uuid4>` stem suffix removed, if any."""
    stem, ext = os.path.splitext(os.path.basename(path))
    return f'{_UUID_SUFFIX_RE.sub("", stem)}{ext}'


class CopyLinkUploadCreator:
    """Creates the pending copy-origin `Upload` linking a source path to a copy's row."""

    def __init__(self, user):
        """Store the user the link is issued to."""
        self._user = user

    def create(self, source_path, row, upload_type, is_cover=False):
        """Create and return the pending copy-origin `Upload` of `row`."""
        return Upload.objects.create(
            user=self._user,
            origin=Upload.ORIGIN_COPY,
            status=Upload.STATUS_PENDING,
            upload_type=upload_type,
            source_path=source_path,
            file_path=row.path,
            is_cover=is_cover,
            content_object=row,
        )


class DocumentPhotoLinkBuilder:
    """Creates a copy's pending gallery `GameDocumentPhoto` and its image link."""

    def __init__(self, user):
        """Store the upload creator of the user the link is issued to."""
        self._uploads = CopyLinkUploadCreator(user)

    def build(self, source_photo, copy, segments, is_cover=False):
        """Return the photo link `Upload` of `copy`, or None when `source_photo` is not ready.

        `segments` are the document's target path segments (e.g.
        `['games', target_slug, 'documents', copy.id]`).
        """
        if source_photo is None or not source_photo.ready:
            return None
        path = PhotoPathBuilder(
            segments, source_filename(source_photo.path), use_uuid=True,
        ).build(root='photos')
        photo = GameDocumentPhoto.objects.create(game_document=copy, path=path, ready=False)
        return self._uploads.create(
            source_photo.path, photo, Upload.UPLOAD_TYPE_IMAGE, is_cover=is_cover,
        )


class DocumentFileLinkBuilder:
    """Creates a copy's pending `GameDocumentFile`, keeping its name, and its file link."""

    def __init__(self, user):
        """Store the upload creator of the user the link is issued to."""
        self._uploads = CopyLinkUploadCreator(user)

    def build(self, source_file, copy, segments):
        """Return `(file, upload)` for `copy`, or None when `source_file` is not ready."""
        if not source_file.ready:
            return None
        path = PhotoPathBuilder(
            segments, source_filename(source_file.path), use_uuid=True,
        ).build(root='files')
        file = GameDocumentFile.objects.create(
            game_document=copy, name=source_file.name, path=path, ready=False,
        )
        return file, self._uploads.create(source_file.path, file, Upload.UPLOAD_TYPE_FILE)


class DocumentFilePhotoLinkBuilder:
    """Creates a copied file's pending `GameDocumentFilePhoto` and its image link."""

    def __init__(self, user):
        """Store the upload creator of the user the link is issued to."""
        self._uploads = CopyLinkUploadCreator(user)

    def build(self, source_photo, file_copy, segments):
        """Return the file photo link `Upload`, or None when `source_photo` is missing/not ready.

        `segments` are the document's target path segments; the photo lands under
        `files/<file-copy-id>/photo<ext>`. The copied file's `photo` FK is set right away, as
        the file photo has no other link to its file (and so to its game).
        """
        if source_photo is None or not source_photo.ready:
            return None
        photo = GameDocumentFilePhoto.objects.create(
            path=self._target_path(source_photo, file_copy, segments), ready=False,
        )
        self._attach(file_copy, photo)
        return self._uploads.create(source_photo.path, photo, Upload.UPLOAD_TYPE_IMAGE)

    @staticmethod
    def _target_path(source_photo, file_copy, segments):
        """Return the fixed `photos/.../files/<file-copy-id>/photo<ext>` path."""
        ext = os.path.splitext(source_photo.path)[1]
        return PhotoPathBuilder(
            [*segments, 'files', file_copy.id], f'photo{ext}', use_uuid=False,
        ).build(root='photos')

    @staticmethod
    def _attach(file_copy, photo):
        """Point the copied file's `photo` FK at the new file photo row."""
        file_copy.photo = photo
        file_copy.save(update_fields=['photo'])
