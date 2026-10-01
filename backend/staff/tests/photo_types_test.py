"""Tests for the staff photo-type registry."""

import pytest

from games.models import GameDocumentFile, GamePhoto
from games.models.base_photo import BasePhoto
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory
from staff import photo_types
from staff.tests.photo_builders import PhotoBuilder
from uploads.views import _PHOTO_HANDLERS

EXPECTED_SLUGS = [
    'game', 'game_faction', 'game_item', 'game_common_item', 'game_document',
    'game_document_file', 'game_possession', 'character', 'character_item', 'treasure',
    'stl_model', 'source', 'collection',
]

EXPECTED_OWNERS = {
    'game': ('Photo Game', None, True),
    'game_faction': ('Red Hand', None, True),
    'game_item': ('Sword', None, True),
    'game_common_item': ('Rope', None, True),
    'game_document': ('Map', None, True),
    'game_document_file': ('letter.pdf', None, True),
    'game_possession': ('Castle', None, True),
    'character': ('Gandalf', 'npc', True),
    'character_item': ('One Ring', None, True),
    'treasure': ('Gold', None, True),
    'stl_model': ('Orc', None, False),
    'source': ('Shop', None, False),
    'collection': ('Box', None, False),
}

GALLERY_SLUGS = {'game', 'character', 'game_document', 'collection'}


class TestPhotoTypesLookup:
    """Tests for `find`, `find_for_model` and `slugs`."""

    def test_slugs_are_ordered(self):
        """Test that slugs returns the 13 slugs in registry order."""
        assert photo_types.slugs() == EXPECTED_SLUGS

    @pytest.mark.parametrize('slug', EXPECTED_SLUGS)
    def test_find_returns_entry(self, slug):
        """Test that find returns the entry for a known slug."""
        assert photo_types.find(slug).slug == slug

    def test_find_unknown_returns_none(self):
        """Test that find returns None for an unknown slug."""
        assert photo_types.find('user') is None

    def test_find_for_model(self):
        """Test that find_for_model returns the entry handling the model."""
        assert photo_types.find_for_model(GamePhoto).slug == 'game'

    def test_find_for_unknown_model_returns_none(self):
        """Test that find_for_model returns None for a non-registered model."""
        assert photo_types.find_for_model(GameDocumentFile) is None

    @pytest.mark.parametrize('slug', EXPECTED_SLUGS)
    def test_gallery_flag(self, slug):
        """Test that only Game, Character, GameDocument and Collection are galleries."""
        assert photo_types.find(slug).gallery is (slug in GALLERY_SLUGS)


class TestPhotoTypesRegistrySync:
    """Tests that the staff registry and finalize's handlers stay in sync."""

    def test_registry_matches_finalize_handlers(self):
        """Test that both registries cover the same photo models."""
        handled = {model for model in _PHOTO_HANDLERS if issubclass(model, BasePhoto)}
        registry = {entry.model for entry in photo_types.PHOTO_TYPES}
        assert registry == handled | {GamePhoto}


@pytest.mark.django_db
class TestPhotoTypesOwners:
    """Tests for owner resolution and description."""

    def setup_method(self):
        """Set up the photo builder."""
        self.builder = PhotoBuilder()

    @pytest.mark.parametrize('slug', EXPECTED_SLUGS)
    def test_owner_of_resolves_owner(self, slug):
        """Test that owner_of returns the photo's owner."""
        photo, owner = self.builder.build(slug)
        assert photo_types.find(slug).owner_of(photo) == owner

    @pytest.mark.parametrize('slug', EXPECTED_SLUGS)
    def test_describe_owner(self, slug):
        """Test that describe_owner returns type, id, name, kind and game."""
        entry = photo_types.find(slug)
        photo, owner = self.builder.build(slug)
        name, kind, scoped = EXPECTED_OWNERS[slug]
        game = {'slug': self.builder.game.game_slug, 'name': 'Photo Game'} if scoped else None
        assert entry.describe_owner(entry.owner_of(photo)) == {
            'type': slug, 'id': owner.pk, 'name': name, 'kind': kind, 'game': game,
        }

    def test_describe_none_owner(self):
        """Test that describe_owner returns None for a missing owner."""
        assert photo_types.find('game').describe_owner(None) is None

    def test_document_file_photo_without_file_has_no_owner(self):
        """Test that a GameDocumentFilePhoto with no owning file resolves to None."""
        entry = photo_types.find('game_document_file')
        photo = entry.model.objects.create(path='photos/orphan.png')
        assert entry.owner_of(photo) is None

    def test_document_file_load_owners_batches(self, django_assert_num_queries):
        """Test that load_owners resolves several file photos with one query."""
        entry = photo_types.find('game_document_file')
        photo_a, _ = self.builder.build('game_document_file')
        photo_b = entry.model.objects.create(path='photos/orphan.png')
        with django_assert_num_queries(1):
            owners = entry.load_owners([photo_a, photo_b])
            assert owners[photo_a.pk].game_document.game.name == 'Photo Game'
        assert owners[photo_b.pk] is None

    def test_pc_character_kind(self):
        """Test that a PC owner is described with kind 'pc'."""
        entry = photo_types.find('character')
        character = CharacterFactory(game=GameFactory(), npc=False, name='Sam')
        photo, _ = self.builder.build('character', owner=character)
        assert entry.describe_owner(entry.owner_of(photo))['kind'] == 'pc'

    def test_global_treasure_has_no_game(self):
        """Test that a treasure with no game is described with game None."""
        entry = photo_types.find('treasure')
        photo, _ = self.builder.build('treasure', owner=TreasureFactory(name='Crown'))
        assert entry.describe_owner(entry.owner_of(photo))['game'] is None

    def test_character_item_name_falls_back_to_game_item(self):
        """Test that an unnamed character item is described with its game item's name."""
        entry = photo_types.find('character_item')
        photo, owner = self.builder.build('character_item')
        owner.name = None
        owner.save()
        photo.refresh_from_db()
        assert entry.describe_owner(entry.owner_of(photo))['name'] == 'Ring'


@pytest.mark.django_db
class TestPhotoTypesGallery:
    """Tests for gallery owner and fallback photo resolution."""

    def setup_method(self):
        """Set up the photo builder."""
        self.builder = PhotoBuilder()

    def test_gallery_owner_for_gallery_type(self):
        """Test that gallery_owner returns the owner of a gallery photo."""
        photo, owner = self.builder.build('character')
        assert photo_types.find('character').gallery_owner(photo) == owner

    def test_gallery_owner_for_non_gallery_type(self):
        """Test that gallery_owner returns None for a non-gallery photo."""
        photo, _ = self.builder.build('treasure')
        assert photo_types.find('treasure').gallery_owner(photo) is None

    def test_fallback_photo_is_most_recent_ready_sibling(self):
        """Test that fallback_photo picks the ready sibling with the highest id."""
        entry = photo_types.find('game')
        photo, game = self.builder.build('game')
        self.builder.build('game', owner=game)
        newest, _ = self.builder.build('game', owner=game)
        self.builder.build('game', owner=game, ready=False)
        assert entry.fallback_photo(game, excluding=photo) == newest

    def test_fallback_photo_none_without_ready_sibling(self):
        """Test that fallback_photo returns None when no ready sibling exists."""
        entry = photo_types.find('game')
        photo, game = self.builder.build('game')
        self.builder.build('game', owner=game, ready=False)
        assert entry.fallback_photo(game, excluding=photo) is None
