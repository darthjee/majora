"""Registry of the photo types managed by the staff photos API.

Every `BasePhoto` subclass has one ordered `PhotoType` entry here, declaring its URL slug,
its model, how to resolve and describe its owner, and whether that owner keeps a gallery of
several photo rows. The registry order is the `types` order of `GET /staff/photos.json`.
This module is free of view/HTTP concerns.
"""

from games.models import (
    CharacterItemPhoto,
    CharacterPhoto,
    GameCommonItemPhoto,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPhoto,
    GameFactionPhoto,
    GameItemPhoto,
    GamePhoto,
    GamePossessionPhoto,
    TreasurePhoto,
)
from miniatures.models import CollectionPhoto, SourcePhoto, StlModelPhoto
from staff.photo_cache_paths import (
    DOCUMENTS,
    FULL_FAMILY,
    CharacterCachePaths,
    CharacterItemCachePaths,
    GameCachePaths,
    GameDocumentFileCachePaths,
    GameResourceCachePaths,
    MiniaturesCachePaths,
    TreasureCachePaths,
)


class PhotoType:
    """One photo model of the registry, with its owner resolution and description rules."""

    def __init__(self, slug, model, owner_field, game_path=('game',), select_related=(),
                 gallery=False, cache_paths=None):
        """Store the photo type configuration.

        `game_path` is the attribute chain from the owner to its game: `()` when the owner is
        the game itself, `None` when the owner is not game-scoped. `cache_paths` is the builder
        (see `staff.photo_cache_paths`) of the proxy cache paths embedding the owner's photo.
        """
        self._cache_paths = cache_paths
        self.slug = slug
        self.model = model
        self.owner_field = owner_field
        self.game_path = game_path
        self.select_related = select_related
        self.gallery = gallery

    def queryset(self):
        """Return every row of the photo model, newest first, with its owner preloaded."""
        return self.model.objects.select_related(*self.select_related).order_by('-id')

    def find_photo(self, photo_id):
        """Return the photo row with the given id, or None."""
        return self.model.objects.filter(pk=photo_id).first()

    def load_owners(self, photos):
        """Return `{photo_id: owner_or_None}` for the given photos."""
        return {photo.pk: getattr(photo, self.owner_field) for photo in photos}

    def owner_of(self, photo):
        """Return the owner of a single photo, or None."""
        return self.load_owners([photo])[photo.pk]

    def describe_owner(self, owner):
        """Return the `{type, id, name, kind, game}` description of `owner`, or None."""
        if owner is None:
            return None
        return {
            'type': self.slug,
            'id': owner.pk,
            'name': self._owner_name(owner),
            'kind': self._owner_kind(owner),
            'game': self._describe_game(self._owner_game(owner)),
        }

    def cache_paths(self, owner):
        """Return the literal proxy cache paths to clear for `owner` (empty when None)."""
        if owner is None or self._cache_paths is None:
            return []
        return self._cache_paths.paths(owner)

    def gallery_owner(self, photo):
        """Return the photo's owner when it keeps a gallery of photos, else None."""
        if not self.gallery:
            return None
        return getattr(photo, self.owner_field)

    def fallback_photo(self, owner, excluding):
        """Return the most recent ready gallery sibling of `excluding`, or None."""
        return (
            self.model.objects.filter(**{self.owner_field: owner}, ready=True)
            .exclude(pk=excluding.pk)
            .order_by('-id')
            .first()
        )

    def _owner_name(self, owner):
        """Return the display name of `owner`."""
        return owner.name

    def _owner_kind(self, owner):
        """Return the owner's kind (only characters have one)."""
        return None

    def _owner_game(self, owner):
        """Follow `game_path` from `owner` to its game, or return None."""
        if self.game_path is None:
            return None
        target = owner
        for attribute in self.game_path:
            target = getattr(target, attribute)
        return target

    @staticmethod
    def _describe_game(game):
        """Return the `{slug, name}` description of `game`, or None."""
        if game is None:
            return None
        return {'slug': game.game_slug, 'name': game.name}


class CharacterPhotoType(PhotoType):
    """Photo type of `CharacterPhoto`: the owner carries a `pc`/`npc` kind."""

    def _owner_kind(self, owner):
        """Return `'npc'` or `'pc'` for the owning character."""
        return 'npc' if owner.npc else 'pc'


class CharacterItemPhotoType(PhotoType):
    """Photo type of `CharacterItemPhoto`: the item name falls back to its game item's."""

    def _owner_name(self, owner):
        """Return the character item name, or its game item's when unset."""
        return owner.name or owner.game_item.name


class GameDocumentFilePhotoType(PhotoType):
    """Photo type of `GameDocumentFilePhoto`: the owner is found through a reverse lookup."""

    def load_owners(self, photos):
        """Return `{photo_id: file_or_None}` with one batch query on `GameDocumentFile`."""
        owners = dict.fromkeys((photo.pk for photo in photos), None)
        for document_file in self._files_for(owners.keys()):
            owners[document_file.photo_id] = owners[document_file.photo_id] or document_file
        return owners

    def _files_for(self, photo_ids):
        """Return the document files pointing at any of the given photo ids."""
        return (
            GameDocumentFile.objects.filter(photo_id__in=list(photo_ids))
            .select_related('game_document__game')
            .order_by('id')
        )

    def _owner_name(self, owner):
        """Return the file name, or its document's name when unset."""
        return owner.name or owner.game_document.name


PHOTO_TYPES = (
    PhotoType('game', GamePhoto, 'game', game_path=(), select_related=('game',),
              gallery=True, cache_paths=GameCachePaths()),
    PhotoType('game_faction', GameFactionPhoto, 'faction', select_related=('faction__game',),
              cache_paths=GameResourceCachePaths('factions')),
    PhotoType('game_item', GameItemPhoto, 'game_item', select_related=('game_item__game',),
              cache_paths=GameResourceCachePaths('items', **FULL_FAMILY)),
    PhotoType('game_common_item', GameCommonItemPhoto, 'game_common_item',
              select_related=('game_common_item__game',),
              cache_paths=GameResourceCachePaths('common_items', **FULL_FAMILY)),
    PhotoType('game_document', GameDocumentPhoto, 'game_document',
              select_related=('game_document__game',), gallery=True, cache_paths=DOCUMENTS),
    GameDocumentFilePhotoType('game_document_file', GameDocumentFilePhoto, None,
                              game_path=('game_document', 'game'),
                              cache_paths=GameDocumentFileCachePaths(DOCUMENTS)),
    PhotoType('game_possession', GamePossessionPhoto, 'game_possession',
              select_related=('game_possession__game',),
              cache_paths=GameResourceCachePaths('possessions', **FULL_FAMILY)),
    CharacterPhotoType('character', CharacterPhoto, 'character',
                       select_related=('character__game',), gallery=True,
                       cache_paths=CharacterCachePaths()),
    CharacterItemPhotoType('character_item', CharacterItemPhoto, 'character_item',
                           game_path=('character', 'game'),
                           select_related=('character_item__character__game',
                                           'character_item__game_item'),
                           cache_paths=CharacterItemCachePaths()),
    PhotoType('treasure', TreasurePhoto, 'treasure', select_related=('treasure__game',),
              cache_paths=TreasureCachePaths()),
    PhotoType('stl_model', StlModelPhoto, 'stl_model', game_path=None,
              select_related=('stl_model',), cache_paths=MiniaturesCachePaths('stl_models')),
    PhotoType('source', SourcePhoto, 'source', game_path=None, select_related=('source',),
              cache_paths=MiniaturesCachePaths('sources')),
    PhotoType('collection', CollectionPhoto, 'collection', game_path=None,
              select_related=('collection',), gallery=True,
              cache_paths=MiniaturesCachePaths('collections')),
)

_BY_SLUG = {photo_type.slug: photo_type for photo_type in PHOTO_TYPES}


def find(slug):
    """Return the registry entry for `slug`, or None when it is not an allowed photo type."""
    return _BY_SLUG.get(slug)


def find_for_model(model):
    """Return the registry entry handling `model`, or None."""
    return next((entry for entry in PHOTO_TYPES if entry.model is model), None)


def slugs():
    """Return the ordered list of photo-type slugs."""
    return [photo_type.slug for photo_type in PHOTO_TYPES]
