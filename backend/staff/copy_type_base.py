"""Base classes of the staff copy types: the registry entry and its shared list/copy behavior.

`CopyType` only declares a tab's slug and model. `ModelCopyType` adds the behavior every tab
repeats, so a tab declares its row serializer and copied fields and overrides the small hooks
it needs (`source_queryset`, `copy_associations`, `cache_paths`). Apart from building the
`Response`, this module is free of view/HTTP concerns.
"""

from django.db import transaction
from django.db.models import Exists, OuterRef
from rest_framework.response import Response

from games.paginator import Paginator

from .cache_clear_header import attach_cache_clear
from .serializers import StaffCopyResultLinkSerializer


class CopyType:
    """One copyable content type: its URL slug, its model, and its list/copy behavior."""

    def __init__(self, slug, model):
        """Store the copy type's URL slug and the model its sources are looked up in."""
        self.slug = slug
        self.model = model

    def find_source(self, source_id):
        """Return the source row with `source_id` (its `game` selected), or None."""
        return self.model.objects.select_related('game').filter(pk=source_id).first()

    def list(self, request, from_game, to_game):
        """Return the tab's paginated `Response` of `from_game`'s entities."""
        raise NotImplementedError

    def copy(self, request, source, target_game):
        """Copy `source` into `target_game` and return the `Response`."""
        raise NotImplementedError


class ModelCopyType(CopyType):
    """Copy type over a model with `game` and `copied_from` FKs, listing and copying its rows.

    Subclasses set `serializer_class` (the list row serializer, reading the `copied_to_target`
    annotation) and `copied_fields` (the source fields copied verbatim).
    """

    serializer_class = None
    copied_fields = ()

    def source_queryset(self, from_game):
        """Return the rows of `from_game` to list, ordered by id."""
        return self.model.objects.filter(game=from_game).order_by('id')

    def list_queryset(self, from_game, to_game):
        """Return the listed rows annotated with `copied_to_target` for `to_game`."""
        copies = self.model.objects.filter(game=to_game, copied_from=OuterRef('pk'))
        return self.source_queryset(from_game).annotate(copied_to_target=Exists(copies))

    def list(self, request, from_game, to_game):
        """Return the paginated, serialized rows with the paginator headers."""
        page, headers = Paginator(request, self.list_queryset(from_game, to_game)).paginate()
        serializer = self.serializer_class(page, many=True)
        return Response(serializer.data, headers=headers)

    def copy(self, request, source, target_game):
        """Copy `source` into `target_game` in one transaction and return the `201` Response."""
        with transaction.atomic():
            result = self._copy_current(request, source.pk, target_game)
        if result is None:
            return Response(status=404)
        return self._copy_response(*result)

    def copy_associations(self, request, source, copy):
        """Create the copy's associated rows and return the copy-origin `Upload`s created."""
        return []

    def cache_paths(self, copy):
        """Return the target game's proxy cache paths made stale by `copy`."""
        return []

    def _copy_current(self, request, source_id, target_game):
        """Re-read the source and copy it, returning `(copy, uploads)`, or None if it is gone."""
        source = self.model.objects.filter(pk=source_id).first()
        if source is None:
            return None
        copy = self._create_copy(source, target_game)
        return copy, self.copy_associations(request, source, copy)

    def _create_copy(self, source, target_game):
        """Create the copy row from the copied fields, in `target_game`, tracing `source`."""
        return self.model.objects.create(
            game=target_game, copied_from=source, **self._copied_values(source),
        )

    def _copied_values(self, source):
        """Return `{field: source_value}` for the copied fields."""
        return {field: getattr(source, field) for field in self.copied_fields}

    def _copy_response(self, copy, uploads):
        """Return the `201 {id, links}` Response carrying `X-Cache-Clear`."""
        links = StaffCopyResultLinkSerializer(uploads, many=True).data
        response = Response({'id': copy.pk, 'links': links}, status=201)
        return attach_cache_clear(response, self.cache_paths(copy))
