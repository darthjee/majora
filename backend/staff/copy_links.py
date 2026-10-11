"""Registry of the photo/file models whose copies are shared through hard-link uploads.

Every copyable photo/file model has one `CopyLink` entry here, declaring how its rows reach
their game (used by the pending-links list), how a copied row becomes its owner's cover, and
which proxy cache paths its finalize clears. This module is free of view/HTTP concerns.

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

    def set_cover(self, row):
        """Make `row` its owner's cover photo; a no-op unless the owner has a cover FK."""

    def cache_paths(self, row, upload):
        """Return the target game's proxy cache paths to clear once `row` is linked."""
        if self._cache_paths is None:
            return []
        return self._cache_paths(row, upload)


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


COPY_LINKS = (
    CoverCopyLink(GameItemPhoto, 'game_item'),
    CoverCopyLink(GameCommonItemPhoto, 'game_common_item'),
    CoverCopyLink(GameFactionPhoto, 'faction'),
    CoverCopyLink(GamePossessionPhoto, 'game_possession'),
    CoverCopyLink(GameDocumentPhoto, 'game_document'),
    CopyLink(GameDocumentFile, 'game_document__game'),
    DocumentFilePhotoCopyLink(),
)


def find_for_model(model):
    """Return the registry entry handling `model`, or None."""
    return next((entry for entry in COPY_LINKS if entry.model is model), None)


def models():
    """Return the tuple of the copyable photo/file models."""
    return tuple(entry.model for entry in COPY_LINKS)
