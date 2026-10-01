"""Test helpers building one photo row (and its owner) for each staff photo type."""

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
from games.tests.factories import (
    CharacterFactory,
    CharacterItemFactory,
    GameCommonItemFactory,
    GameDocumentFactory,
    GameFactionFactory,
    GameFactory,
    GameItemFactory,
    GamePossessionFactory,
    TreasureFactory,
)
from miniatures.models import CollectionPhoto, SourcePhoto, StlModelPhoto
from miniatures.tests.factories import CollectionFactory, SourceFactory, StlModelFactory


class PhotoBuilder:
    """Builds a photo row of a given type, attached to a freshly created owner."""

    def __init__(self, game=None):
        """Store the game used for game-scoped owners (created lazily)."""
        self._game = game

    @property
    def game(self):
        """Return the game used by game-scoped owners, creating it on first use."""
        if self._game is None:
            self._game = GameFactory(name='Photo Game')
        return self._game

    def build(self, slug, path='photos/x/photo.png', ready=True, owner=None):
        """Create and return `(photo, owner)` for the photo type `slug`."""
        return getattr(self, f'_build_{slug}')(path, ready, owner)

    def _build_game(self, path, ready, owner):
        """Build a GamePhoto."""
        owner = owner or self.game
        return GamePhoto.objects.create(game=owner, path=path, ready=ready), owner

    def _build_game_faction(self, path, ready, owner):
        """Build a GameFactionPhoto."""
        owner = owner or GameFactionFactory(game=self.game, name='Red Hand')
        return GameFactionPhoto.objects.create(faction=owner, path=path, ready=ready), owner

    def _build_game_item(self, path, ready, owner):
        """Build a GameItemPhoto."""
        owner = owner or GameItemFactory(game=self.game, name='Sword')
        return GameItemPhoto.objects.create(game_item=owner, path=path, ready=ready), owner

    def _build_game_common_item(self, path, ready, owner):
        """Build a GameCommonItemPhoto."""
        owner = owner or GameCommonItemFactory(game=self.game, name='Rope')
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=owner, path=path, ready=ready
        )
        return photo, owner

    def _build_game_document(self, path, ready, owner):
        """Build a GameDocumentPhoto."""
        owner = owner or GameDocumentFactory(game=self.game, name='Map')
        photo = GameDocumentPhoto.objects.create(game_document=owner, path=path, ready=ready)
        return photo, owner

    def _build_game_document_file(self, path, ready, owner):
        """Build a GameDocumentFilePhoto, pointed at by a GameDocumentFile."""
        photo = GameDocumentFilePhoto.objects.create(path=path, ready=ready)
        if owner is None:
            document = GameDocumentFactory(game=self.game, name='Letters')
            owner = GameDocumentFile.objects.create(
                game_document=document, name='letter.pdf', path='files/letter.pdf'
            )
        owner.photo = photo
        owner.save()
        return photo, owner

    def _build_game_possession(self, path, ready, owner):
        """Build a GamePossessionPhoto."""
        owner = owner or GamePossessionFactory(game=self.game, name='Castle')
        photo = GamePossessionPhoto.objects.create(
            game_possession=owner, path=path, ready=ready
        )
        return photo, owner

    def _build_character(self, path, ready, owner):
        """Build a CharacterPhoto."""
        owner = owner or CharacterFactory(game=self.game, name='Gandalf')
        return CharacterPhoto.objects.create(character=owner, path=path, ready=ready), owner

    def _build_character_item(self, path, ready, owner):
        """Build a CharacterItemPhoto."""
        if owner is None:
            character = CharacterFactory(game=self.game, name='Frodo')
            item = GameItemFactory(game=self.game, name='Ring')
            owner = CharacterItemFactory(character=character, game_item=item, name='One Ring')
        photo = CharacterItemPhoto.objects.create(character_item=owner, path=path, ready=ready)
        return photo, owner

    def _build_treasure(self, path, ready, owner):
        """Build a TreasurePhoto."""
        owner = owner or TreasureFactory(name='Gold', game=self.game)
        return TreasurePhoto.objects.create(treasure=owner, path=path, ready=ready), owner

    def _build_stl_model(self, path, ready, owner):
        """Build a StlModelPhoto."""
        owner = owner or StlModelFactory(name='Orc')
        return StlModelPhoto.objects.create(stl_model=owner, path=path, ready=ready), owner

    def _build_source(self, path, ready, owner):
        """Build a SourcePhoto."""
        owner = owner or SourceFactory(name='Shop')
        return SourcePhoto.objects.create(source=owner, path=path, ready=ready), owner

    def _build_collection(self, path, ready, owner):
        """Build a CollectionPhoto."""
        owner = owner or CollectionFactory(name='Box')
        return CollectionPhoto.objects.create(collection=owner, path=path, ready=ready), owner
