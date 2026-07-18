"""Tests for the GameItem model."""

from django.test import TestCase

from games.models import GameItem
from games.tests.factories import GameFactory


class TestGameItem(TestCase):
    """Tests for the GameItem model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_game_item_creation(self):
        """Test that a game item can be created linked to a game."""
        item = GameItem.objects.create(
            game=self.game, name='Cloak of Elvenkind', description='A shimmering cloak.',
        )
        assert item.game == self.game
        assert item.name == 'Cloak of Elvenkind'
        assert item.description == 'A shimmering cloak.'

    def test_hidden_defaults_to_false(self):
        """Test that a game item is not hidden by default."""
        item = GameItem.objects.create(game=self.game, name='Ring')
        assert item.hidden is False

    def test_game_item_can_be_hidden(self):
        """Test that a game item can be created as hidden."""
        item = GameItem.objects.create(game=self.game, name='Secret Ring', hidden=True)
        assert item.hidden is True

    def test_description_defaults_to_empty_string(self):
        """Test that description defaults to an empty string when not specified."""
        item = GameItem.objects.create(game=self.game, name='Plain Ring')
        assert item.description == ''

    def test_game_item_str(self):
        """Test string representation of a game item."""
        item = GameItem(game=self.game, name='Amulet of Health')
        assert str(item) == 'Amulet of Health'

    def test_game_items_related_name(self):
        """Test that game items can be accessed via the game's related name."""
        GameItem.objects.create(game=self.game, name='Item One')
        GameItem.objects.create(game=self.game, name='Item Two')
        assert self.game.items.count() == 2

    def test_game_item_ordering(self):
        """Test that game items are ordered by id."""
        first = GameItem.objects.create(game=self.game, name='First Item')
        second = GameItem.objects.create(game=self.game, name='Second Item')
        items = list(GameItem.objects.all())
        assert items[0].id == first.id
        assert items[1].id == second.id

    def test_deleting_game_cascades_to_game_item(self):
        """Test that deleting a game deletes its game items."""
        item = GameItem.objects.create(game=self.game, name='Doomed Item')
        self.game.delete()
        assert not GameItem.objects.filter(id=item.id).exists()
