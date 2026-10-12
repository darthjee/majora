"""The `documents` copy type: copies a `GameDocument` with its pages, photos and files."""

from django.db.models import Count, Q

from games.models import GameDocument

from .copy_cache_paths import documents_copy_cache_paths
from .copy_document_associations import DocumentAssociationsCopier
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyDocumentSerializer


class DocumentsCopyType(ModelCopyType):
    """Copy type of game documents; see `docs/agents/specs/game-content-copy/documents.md`."""

    copied_fields = ('name', 'description', 'hidden')

    def __init__(self):
        """Configure the `documents` slug over `GameDocument`."""
        super().__init__('documents', GameDocument)

    def serializer_class(self):
        """Return the documents list row serializer."""
        return StaffCopyDocumentSerializer

    def source_queryset(self, from_game):
        """Return the game's documents, by id, with their cover and the copied-row counts."""
        return super().source_queryset(from_game).select_related('photo').annotate(
            pages_count=Count('pages', distinct=True),
            photos_count=Count('photos', filter=Q(photos__ready=True), distinct=True),
            files_count=Count('files', filter=Q(files__ready=True), distinct=True),
        )

    def copy_associations(self, request, source, copy):
        """Copy the source's pages, ready photos, files and file photos; return their links."""
        return DocumentAssociationsCopier(request.user).copy(source, copy)

    def cache_paths(self, copy):
        """Return the target's document family, the copy's page lists and the available lists."""
        return documents_copy_cache_paths(copy)
