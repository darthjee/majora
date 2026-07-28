"""Tests for the GameLink model."""

from django.test import TestCase

from games.models import GameLink
from games.tests.factories import GameFactory


class TestGameLink(TestCase):
    """Tests for the GameLink model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_link_creation(self):
        """Test that a link can be created with a game FK."""
        link = GameLink.objects.create(
            text='Rulebook', url='http://example.com/rules', game=self.game
        )
        assert link.text == 'Rulebook'
        assert link.url == 'http://example.com/rules'
        assert link.game == self.game

    def test_link_creation_with_link_type(self):
        """Test that a link can be created with a link_type set."""
        link = GameLink.objects.create(
            text='LootStudio Loot',
            url='http://example.com/loot',
            game=self.game,
            link_type=GameLink.LINK_TYPE_LOOTSTUDIO,
        )
        assert link.link_type == 'lootstudio'

    def test_link_creation_with_link_type_diary(self):
        """Test that a link can be created with the diary link_type."""
        link = GameLink.objects.create(
            text='Frodo Diary',
            url='http://example.com/diary',
            game=self.game,
            link_type=GameLink.LINK_TYPE_DIARY,
        )
        assert link.link_type == 'diary'

    def test_link_creation_with_link_type_music(self):
        """Test that a link can be created with the music link_type."""
        link = GameLink.objects.create(
            text='Theme Song',
            url='http://example.com/music',
            game=self.game,
            link_type=GameLink.LINK_TYPE_MUSIC,
        )
        assert link.link_type == 'music'

    def test_link_creation_with_link_type_stl(self):
        """Test that a link can be created with the stl link_type."""
        link = GameLink.objects.create(
            text='Mini Model',
            url='http://example.com/model.stl',
            game=self.game,
            link_type=GameLink.LINK_TYPE_STL,
        )
        assert link.link_type == 'stl'

    def test_link_creation_with_link_type_background(self):
        """Test that a link can be created with the background link_type."""
        link = GameLink.objects.create(
            text='World Lore',
            url='http://example.com/lore',
            game=self.game,
            link_type=GameLink.LINK_TYPE_BACKGROUND,
        )
        assert link.link_type == 'background'

    def test_link_creation_with_link_type_reference(self):
        """Test that a link can be created with the reference link_type."""
        link = GameLink.objects.create(
            text='Rules Reference',
            url='http://example.com/reference',
            game=self.game,
            link_type=GameLink.LINK_TYPE_REFERENCE,
        )
        assert link.link_type == 'reference'

    def test_link_default_link_type_is_blank(self):
        """Test that link_type defaults to an empty string when not set."""
        link = GameLink.objects.create(
            text='Rulebook', url='http://example.com/rules', game=self.game
        )
        assert link.link_type == ''

    def test_link_str(self):
        """Test string representation of a link."""
        link = GameLink(text='Map', url='http://example.com/map', game=self.game)
        assert str(link) == 'Map'

    def test_game_links_reverse_relation(self):
        """Test that game.links returns links associated with the game."""
        link = GameLink.objects.create(
            text='Wiki', url='http://example.com/wiki', game=self.game
        )
        assert link in self.game.links.all()
