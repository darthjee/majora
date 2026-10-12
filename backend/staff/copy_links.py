"""Registry of the photo/file models whose copies are shared through hard-link uploads.

Every copyable photo/file model has one `CopyLink` entry here, declaring how its rows reach
their game and how they are described (used by the pending-links list), how a copied row
becomes its owner's cover, and which proxy cache paths its finalize clears. This module is
free of view/HTTP concerns.

`cache_paths(row, upload)` is a **per-type hook**: it returns `[]` until the tab issues fill it
in, following the "Cache" section of each tab spec under `docs/agents/specs/game-content-copy/`
(`items.md`, `common-items.md`, `documents.md`, `factions.md`, `possessions.md`). A tab plugs its
builder in by passing `cache_paths=<callable(row, upload)>` to its entry below.
"""

from games.models import (
    GameCommonItemPhoto,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPhoto,
    GameFactionPhoto,
    GameItemPhoto,
    GamePossessionPhoto,
)
from staff import photo_types
from staff.copy_cache_paths import (
    common_items_copy_cache_paths,
    factions_copy_cache_paths,
    items_copy_cache_paths,
    possessions_copy_cache_paths,
)


class CopyLink:
    """One copyable photo/file model: its game reach, cover rule and cache-path hook."""

    def __init__(self, model, game_lookup, cache_paths=None):
        """Store the model, the ORM lookup from a row to its game and the cache-path hook."""
        self.model = model
        self._game_lookup = game_lookup
        self._cache_paths = cache_paths

    @property
    def photo_type(self):
        """Return the staff photo type of the model (owner resolution), or None for files."""
        return photo_types.find_for_model(self.model)

    def object_ids_in(self, game):
        """Return a values list of the ids of the rows belonging to `game`."""
        return self.model.objects.filter(**{self._game_lookup: game}).values_list(
            'pk', flat=True
        )

    def load_rows(self, ids):
        """Return the rows with the given ids, with what describing them needs preloaded."""
        return self.model.objects.filter(pk__in=list(ids)).select_related(
            *self._select_related()
        )

    def describe_rows(self, rows):
        """Return `{row_id: owner_description_or_None}` for the given rows."""
        owners = self.photo_type.load_owners(rows)
        return {pk: self.photo_type.describe_owner(owner) for pk, owner in owners.items()}

    def set_cover(self, row):
        """Make `row` its owner's cover photo; a no-op unless the owner has a cover FK."""

    def cache_paths(self, row, upload):
        """Return the target game's proxy cache paths to clear once `row` is linked."""
        if self._cache_paths is None:
            return []
        return self._cache_paths(row, upload)

    def _select_related(self):
        """Return the relations to preload when describing rows."""
        return self.photo_type.select_related


class CoverCopyLink(CopyLink):
    """Copy link of a photo whose owner keeps a cover `photo` FK."""

    def __init__(self, model, owner_field, cache_paths=None):
        """Store the owner field; the row reaches its game through that owner."""
        super().__init__(model, f'{owner_field}__game', cache_paths=cache_paths)
        self._owner_field = owner_field

    def set_cover(self, row):
        """Point the owner's cover `photo` FK at `row` and save the owner."""
        owner = getattr(row, self._owner_field)
        owner.photo = row
        owner.save()


class DocumentFileCopyLink(CopyLink):
    """Copy link of `GameDocumentFile`: the copied file is described as the file itself."""

    def __init__(self, cache_paths=None):
        """Configure the entry for `GameDocumentFile`."""
        super().__init__(GameDocumentFile, 'game_document__game', cache_paths=cache_paths)

    def describe_rows(self, rows):
        """Return `{file_id: description}`, using the document-file photo type's wording."""
        describer = photo_types.find('game_document_file')
        return {row.pk: describer.describe_owner(row) for row in rows}

    def _select_related(self):
        """Return the relations to preload when describing files."""
        return ('game_document__game',)


class DocumentFilePhotoCopyLink(CopyLink):
    """Copy link of `GameDocumentFilePhoto`: it reaches its game only via `GameDocumentFile`."""

    def __init__(self, cache_paths=None):
        """Configure the entry for `GameDocumentFilePhoto`."""
        super().__init__(GameDocumentFilePhoto, None, cache_paths=cache_paths)

    def object_ids_in(self, game):
        """Return the ids of the photos pointed at by the files of `game`'s documents."""
        return GameDocumentFile.objects.filter(
            game_document__game=game, photo_id__isnull=False,
        ).values_list('photo_id', flat=True)


def _item_photo_cache_paths(row, upload):
    """Return the copy cache paths of the item owning a linked `GameItemPhoto`."""
    return items_copy_cache_paths(row.game_item)


def _common_item_photo_cache_paths(row, upload):
    """Return the copy cache paths of the common item owning a linked `GameCommonItemPhoto`."""
    return common_items_copy_cache_paths(row.game_common_item)


def _faction_photo_cache_paths(row, upload):
    """Return the copy cache paths of the faction owning a linked `GameFactionPhoto`."""
    return factions_copy_cache_paths(row.faction)


def _possession_photo_cache_paths(row, upload):
    """Return the copy cache paths of the possession owning a linked `GamePossessionPhoto`."""
    return possessions_copy_cache_paths(row.game_possession)


COPY_LINKS = (
    CoverCopyLink(GameItemPhoto, 'game_item', cache_paths=_item_photo_cache_paths),
    CoverCopyLink(
        GameCommonItemPhoto, 'game_common_item', cache_paths=_common_item_photo_cache_paths,
    ),
    CoverCopyLink(GameFactionPhoto, 'faction', cache_paths=_faction_photo_cache_paths),
    CoverCopyLink(
        GamePossessionPhoto, 'game_possession', cache_paths=_possession_photo_cache_paths,
    ),
    CoverCopyLink(GameDocumentPhoto, 'game_document'),
    DocumentFileCopyLink(),
    DocumentFilePhotoCopyLink(),
)


def find_for_model(model):
    """Return the registry entry handling `model`, or None."""
    return next((entry for entry in COPY_LINKS if entry.model is model), None)


def models():
    """Return the tuple of the copyable photo/file models."""
    return tuple(entry.model for entry in COPY_LINKS)
