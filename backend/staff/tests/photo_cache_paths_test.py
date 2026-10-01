"""Tests for the proxy cache paths declared by each staff photo type."""

import pytest

from games.tests.factories import (
    CharacterFactionFactory,
    CharacterFactory,
    GameFactionFactory,
    GameFactory,
    TreasureFactory,
)
from staff import photo_types
from staff.tests.photo_builders import PhotoBuilder


def _expected_game(owner):
    """Return the expected paths of a game owner."""
    return ['/games.json', '/my-games.json', '/games/foo.json', '/games/foo/photos.json']


def _expected_game_faction(owner):
    """Return the expected paths of a faction owner."""
    return ['/games/foo/factions.json', f'/games/foo/factions/{owner.pk}.json']


def _full_family(resource, owner_id):
    """Return the expected `.json`/`all.json`/`<id>.json`/`<id>/full.json` family paths."""
    base = f'/games/foo/{resource}'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{owner_id}.json',
            f'{base}/{owner_id}/full.json']


def _documents_family(document_id):
    """Return the expected documents family paths of a document."""
    base = f'/games/foo/documents/{document_id}'
    return [
        '/games/foo/documents.json', '/games/foo/documents/all.json', f'{base}.json',
        f'{base}/full.json', f'{base}/photos.json', f'{base}/photos/all.json',
        f'{base}/files.json', f'{base}/files/all.json',
    ]


def _expected_character(owner):
    """Return the expected paths of an NPC owner without factions."""
    base = f'/games/foo/npcs/{owner.pk}'
    return ['/games/foo/npcs.json', '/games/foo/npcs/all.json', f'{base}.json',
            f'{base}/full.json', f'{base}/photos.json', f'{base}/factions.json']


def _expected_character_item(owner):
    """Return the expected paths of an NPC's character item owner."""
    base = f'/games/foo/npcs/{owner.character.pk}/items'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{owner.pk}.json',
            f'{base}/{owner.pk}/full.json']


def _expected_treasure(owner):
    """Return the expected paths of a game-scoped treasure owner."""
    return ['/treasures.json', f'/treasures/{owner.pk}.json', '/games/foo/treasures.json',
            '/games/foo/treasures/all.json', f'/games/foo/treasures/{owner.pk}.json']


def _miniatures(resource):
    """Return a function building the expected paths of a miniatures owner."""
    return lambda owner: [f'/miniatures/{resource}.json',
                          f'/miniatures/{resource}/{owner.pk}.json']


EXPECTED_PATHS = {
    'game': _expected_game,
    'game_faction': _expected_game_faction,
    'game_item': lambda owner: _full_family('items', owner.pk),
    'game_common_item': lambda owner: _full_family('common_items', owner.pk),
    'game_document': lambda owner: _documents_family(owner.pk),
    'game_document_file': lambda owner: _documents_family(owner.game_document.pk),
    'game_possession': lambda owner: _full_family('possessions', owner.pk),
    'character': _expected_character,
    'character_item': _expected_character_item,
    'treasure': _expected_treasure,
    'stl_model': _miniatures('stl_models'),
    'source': _miniatures('sources'),
    'collection': _miniatures('collections'),
}


@pytest.mark.django_db
class TestPhotoTypeCachePaths:
    """Tests for `PhotoType.cache_paths`."""

    def setup_method(self):
        """Set up a photo builder on the `foo` game."""
        self.game = GameFactory(game_slug='foo')
        self.builder = PhotoBuilder(game=self.game)

    def test_every_type_is_covered(self):
        """Test that the expectations cover every registered photo type."""
        assert set(EXPECTED_PATHS) == set(photo_types.slugs())

    @pytest.mark.parametrize('slug', photo_types.slugs())
    def test_paths_for_owner(self, slug):
        """Test that each photo type lists its owner's entity and collection paths."""
        _, owner = self.builder.build(slug)
        assert photo_types.find(slug).cache_paths(owner) == EXPECTED_PATHS[slug](owner)

    @pytest.mark.parametrize('slug', photo_types.slugs())
    def test_none_owner_returns_empty_list(self, slug):
        """Test that an unresolved owner yields no path."""
        assert photo_types.find(slug).cache_paths(None) == []

    @pytest.mark.parametrize('slug', photo_types.slugs())
    def test_paths_are_literal_json_paths(self, slug):
        """Test that every path starts with `/`, ends in `.json` and has no placeholder."""
        _, owner = self.builder.build(slug)
        for path in photo_types.find(slug).cache_paths(owner):
            assert path.startswith('/') and path.endswith('.json')
            assert ':' not in path and '<' not in path and '..' not in path

    def test_pc_character_uses_pcs_family(self):
        """Test that a PC lists the pcs family, without an `all.json` list."""
        pc = CharacterFactory(game=self.game, npc=False)
        base = f'/games/foo/pcs/{pc.pk}'
        assert photo_types.find('character').cache_paths(pc) == [
            '/games/foo/pcs.json', f'{base}.json', f'{base}/full.json', f'{base}/photos.json',
            f'{base}/factions.json',
        ]

    def test_character_lists_its_factions_characters(self):
        """Test that a character's factions' character lists are cleared too."""
        npc = CharacterFactory(game=self.game, npc=True)
        faction = GameFactionFactory(game=self.game)
        CharacterFactionFactory(character=npc, game_faction=faction)
        paths = photo_types.find('character').cache_paths(npc)
        assert paths[-2:] == [
            f'/games/foo/factions/{faction.pk}/characters.json',
            f'/games/foo/factions/{faction.pk}/characters/all.json',
        ]

    def test_pc_character_item_uses_pcs_family(self):
        """Test that a PC's item lists the PC-scoped items family."""
        pc = CharacterFactory(game=self.game, npc=False)
        _, owner = self.builder.build('character_item')
        owner.character = pc
        owner.save()
        paths = photo_types.find('character_item').cache_paths(owner)
        assert paths[0] == f'/games/foo/pcs/{pc.pk}/items.json'

    def test_game_less_treasure_lists_only_top_level_paths(self):
        """Test that a treasure without a game lists only the top-level treasure paths."""
        treasure = TreasureFactory(game=None)
        assert photo_types.find('treasure').cache_paths(treasure) == [
            '/treasures.json', f'/treasures/{treasure.pk}.json',
        ]
