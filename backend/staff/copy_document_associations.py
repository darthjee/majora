"""Copies the pages, photos, files and file photos of a document into its copy.

Used by the `documents` copy type inside its copy transaction. Only rows are written (no file
I/O): pages are recreated at `version=1` with no page history, and every ready photo, file and
file photo becomes a not-ready row of the copy with one pending copy-origin `Upload`. See
`docs/agents/game-content-copy/documents.md`.
"""

from games.models import GameDocumentPage

from .copy_document_links import (
    DocumentFileLinkBuilder,
    DocumentFilePhotoLinkBuilder,
    DocumentPhotoLinkBuilder,
)


class DocumentPagesCopier:
    """Recreates a document's current pages on its copy, each at `version=1`."""

    def copy(self, source, copy):
        """Bulk-create one page of `copy` per page of `source`, keeping `order` and `content`."""
        GameDocumentPage.objects.bulk_create(
            [self._page(page, copy) for page in source.pages.order_by('order')]
        )

    @staticmethod
    def _page(page, copy):
        """Return the unsaved copy of `page` on `copy`."""
        return GameDocumentPage(
            game_document=copy, order=page.order, content=page.content, version=1,
        )


class DocumentPhotosCopier:
    """Links every ready gallery photo of a document to its copy, flagging the cover."""

    def __init__(self, user):
        """Store the photo link builder of the user the links are issued to."""
        self._builder = DocumentPhotoLinkBuilder(user)

    def copy(self, source, copy, segments):
        """Return one link `Upload` per ready photo of `source`."""
        return [
            self._builder.build(photo, copy, segments, is_cover=photo.pk == source.photo_id)
            for photo in source.photos.filter(ready=True).order_by('id')
        ]


class DocumentFilesCopier:
    """Links every ready file of a document, and its ready photo, to the copy."""

    def __init__(self, user):
        """Store the file and file photo link builders of the user the links are issued to."""
        self._files = DocumentFileLinkBuilder(user)
        self._photos = DocumentFilePhotoLinkBuilder(user)

    def copy(self, source, copy, segments):
        """Return the file and file photo link `Upload`s of every ready file of `source`."""
        uploads = []
        for source_file in source.files.filter(ready=True).select_related('photo').order_by('id'):
            uploads.extend(self._copy_file(source_file, copy, segments))
        return uploads

    def _copy_file(self, source_file, copy, segments):
        """Return the file link, plus the file photo link when the source photo is ready."""
        file_copy, upload = self._files.build(source_file, copy, segments)
        photo_upload = self._photos.build(source_file.photo, file_copy, segments)
        return [upload] if photo_upload is None else [upload, photo_upload]


class DocumentAssociationsCopier:
    """Copies a document's pages, photos, files and file photos into its copy."""

    def __init__(self, user):
        """Store the per-association copiers of the user the links are issued to."""
        self._pages = DocumentPagesCopier()
        self._photos = DocumentPhotosCopier(user)
        self._files = DocumentFilesCopier(user)

    def copy(self, source, copy):
        """Copy every association of `source` into `copy` and return the created uploads."""
        segments = self._segments(copy)
        self._pages.copy(source, copy)
        return self._photos.copy(source, copy, segments) + self._files.copy(
            source, copy, segments,
        )

    @staticmethod
    def _segments(copy):
        """Return the copy's path segments: `games/<target>/documents/<copy-id>`."""
        return ['games', copy.game.game_slug, 'documents', copy.pk]
