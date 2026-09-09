"""Source/Collection find-or-create sync helpers for the crawler import serializer."""

from django.db import transaction

from miniatures.models import Collection, Source


class SourceSync:
    """Resolves (get-or-creates) the `Source` a crawler-imported `StlModel` is attributed to."""

    def __init__(self, name):
        """Store the `name` to resolve a `Source` by."""
        self.name = name

    def resolve(self):
        """Get-or-create and return the `Source` matching `self.name`."""
        with transaction.atomic():
            source, _created = Source.objects.get_or_create(name=self.name)
        return source


class CollectionSync:
    """Resolves (finds or creates) the `Collection` a crawler-imported `StlModel` belongs to.

    Matches an existing `Collection` by `external_id` first, then by `name` -- both globally,
    not scoped by `source`, since `Collection.name` is globally unique. If a match is found,
    `source` is always (re)assigned to the resolved `Source`, even overwriting a different prior
    value or `None`; when `update_existing` is `True`, `name`/`url` are also refreshed from
    whichever were given. If no match is found, a new `Collection` is created with `source` and
    whichever of `external_id`/`name`/`url` were given -- falling back to `external_id` as a
    placeholder `name` when none was given, since `Collection.name` is non-nullable. `resolve()`
    sets `self.created` so callers can tell whether a new row was created.
    """

    def __init__(self, source, external_id=None, name=None, url=None, update_existing=False):
        """Store the resolved `source`, match/create fields, and the update-on-match flag."""
        self.source = source
        self.external_id = external_id
        self.name = name
        self.url = url
        self.update_existing = update_existing

    def resolve(self):
        """Find or create the `Collection`, (re)assigning it to `self.source`."""
        with transaction.atomic():
            collection = self._find()
            self.created = collection is None
            if collection is None:
                collection = self._create()
            else:
                self._reassign_source(collection)
                if self.update_existing:
                    self._update_details(collection)
        return collection

    def _find(self):
        """Look up an existing `Collection` by `external_id` first, then by `name`."""
        if self.external_id:
            collection = Collection.objects.filter(external_id=self.external_id).first()
            if collection is not None:
                return collection
        if self.name:
            return Collection.objects.filter(name=self.name).first()
        return None

    def _create(self):
        """Create a new `Collection`, falling back to `external_id` as a placeholder `name`."""
        return Collection.objects.create(
            source=self.source,
            external_id=self.external_id,
            name=self.name or self.external_id,
            url=self.url,
        )

    def _reassign_source(self, collection):
        """Save `collection.source` as `self.source` when it differs from the current value."""
        if collection.source_id != self.source.id:
            collection.source = self.source
            collection.save(update_fields=['source'])

    def _update_details(self, collection):
        """Refresh `collection.name`/`url` from whichever of `self.name`/`self.url` were given."""
        update_fields = []
        if self.name and collection.name != self.name:
            collection.name = self.name
            update_fields.append('name')
        if self.url and collection.url != self.url:
            collection.url = self.url
            update_fields.append('url')
        if update_fields:
            collection.save(update_fields=update_fields)
