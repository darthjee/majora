"""Tests for the GameCommonItem model."""

from django.test import TestCase

from games.models import GameCommonItem
from games.tests.factories import GameFactory


class TestGameCommonItem(TestCase):
    """Tests for the GameCommonItem model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_game_common_item_creation(self):
        """Test that a game common item can be created linked to a game."""
        common_item = GameCommonItem.objects.create(
            game=self.game, name='Healing Potion', price=15,
            description='Restores a small amount of health.',
        )
        assert common_item.game == self.game
        assert common_item.name == 'Healing Potion'
        assert common_item.price == 15
        assert common_item.description == 'Restores a small amount of health.'

    def test_hidden_defaults_to_false(self):
        """Test that a game common item is not hidden by default."""
        common_item = GameCommonItem.objects.create(game=self.game, name='Arrow', price=1)
        assert common_item.hidden is False

    def test_game_common_item_can_be_hidden(self):
        """Test that a game common item can be created as hidden."""
        common_item = GameCommonItem.objects.create(
            game=self.game, name='Secret Poison', price=50, hidden=True,
        )
        assert common_item.hidden is True

    def test_description_defaults_to_empty_string(self):
        """Test that description defaults to an empty string when not specified."""
        common_item = GameCommonItem.objects.create(game=self.game, name='Torch', price=2)
        assert common_item.description == ''

    def test_category_defaults_to_other(self):
        """Test that category defaults to CATEGORY_OTHER when not specified."""
        common_item = GameCommonItem.objects.create(game=self.game, name='Torch', price=2)
        assert common_item.category == GameCommonItem.CATEGORY_OTHER

    def test_game_common_item_can_have_a_category(self):
        """Test that a game common item can be created with an explicit category."""
        common_item = GameCommonItem.objects.create(
            game=self.game, name='Healing Potion', price=15,
            category=GameCommonItem.CATEGORY_POTION,
        )
        assert common_item.category == GameCommonItem.CATEGORY_POTION

    def test_game_common_item_str(self):
        """Test string representation of a game common item."""
        common_item = GameCommonItem(game=self.game, name='Healing Potion', price=15)
        assert str(common_item) == 'Healing Potion'

    def test_game_common_items_related_name(self):
        """Test that game common items can be accessed via the game's related name."""
        GameCommonItem.objects.create(game=self.game, name='Item One', price=1)
        GameCommonItem.objects.create(game=self.game, name='Item Two', price=2)
        assert self.game.common_items.count() == 2

    def test_game_common_item_ordering(self):
        """Test that game common items are ordered by id."""
        first = GameCommonItem.objects.create(game=self.game, name='First Item', price=1)
        second = GameCommonItem.objects.create(game=self.game, name='Second Item', price=2)
        common_items = list(GameCommonItem.objects.all())
        assert common_items[0].id == first.id
        assert common_items[1].id == second.id

    def test_deleting_game_cascades_to_game_common_item(self):
        """Test that deleting a game deletes its game common items."""
        common_item = GameCommonItem.objects.create(
            game=self.game, name='Doomed Item', price=1,
        )
        self.game.delete()
        assert not GameCommonItem.objects.filter(id=common_item.id).exists()
