"""Tests for the Game model."""

import pytest
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from django.utils.text import slugify

from games.models import Game, GameTreasure
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGame:
    """Tests for the Game model."""

    def test_game_creation(self):
        """Test that a game can be created with name and game_slug."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        assert game.name == 'Test Game'
        assert game.game_slug == 'test-game'

    def test_game_slug_auto_generated(self):
        """Test that game_slug is auto-generated from name when not provided."""
        game = Game(name='My RPG Campaign')
        game.save()
        assert game.game_slug == slugify('My RPG Campaign')

    def test_game_slug_unique(self):
        """Test that game_slug must be unique."""
        from django.db import IntegrityError

        GameFactory(name='Game One', game_slug='same-slug')
        with pytest.raises(IntegrityError):
            GameFactory(name='Game Two', game_slug='same-slug')

    def test_game_str(self):
        """Test string representation of a game."""
        game = Game(name='My Game', game_slug='my-game')
        assert str(game) == 'My Game'

    def test_game_ordering(self):
        """Test that games are ordered by id."""
        first = GameFactory(name='Zebra Game', game_slug='zebra-game')
        second = GameFactory(name='Alpha Game', game_slug='alpha-game')
        games = list(Game.objects.all())
        assert games[0].id == first.id
        assert games[1].id == second.id


class TestGameCanBeEditedBy(TestCase):
    """Tests for Game.can_be_edited_by()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the game."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        assert self.game.can_be_edited_by(superuser) is True

    def test_dm_can_edit(self):
        """Test that a DM of the game may edit it."""
        assert self.game.can_be_edited_by(self.dm_user) is True

    def test_non_dm_user_cannot_edit(self):
        """Test that a regular user who is not a DM cannot edit the game."""
        other = UserFactory(username='other', password='secret-password')
        assert self.game.can_be_edited_by(other) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.game.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.game.can_be_edited_by(AnonymousUser()) is False


class TestGameCanBeEditedByRoles(TestCase):
    """Tests for Game.can_be_edited_by_roles()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_superuser_role_can_edit(self):
        """Test that the superuser role may edit the game."""
        assert self.game.can_be_edited_by_roles(is_superuser=True, is_dm=False) is True

    def test_dm_role_can_edit(self):
        """Test that the dm role may edit the game."""
        assert self.game.can_be_edited_by_roles(is_superuser=False, is_dm=True) is True

    def test_no_roles_cannot_edit(self):
        """Test that neither role present may not edit the game."""
        assert self.game.can_be_edited_by_roles(is_superuser=False, is_dm=False) is False


class TestGameTreasuresThroughModel(TestCase):
    """Tests for Game.treasures going through the GameTreasure model."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a treasure."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.treasure = TreasureFactory(name='Golden Crown', value=500)

    def test_add_creates_a_game_treasure_row(self):
        """Test that adding a treasure to a game creates a GameTreasure through-row."""
        self.game.treasures.add(self.treasure)
        assert GameTreasure.objects.filter(game=self.game, treasure=self.treasure).exists()

    def test_added_game_treasure_defaults(self):
        """Test that a freshly created GameTreasure row has unlimited/zero-acquired defaults."""
        self.game.treasures.add(self.treasure)
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        assert game_treasure.max_units is None
        assert game_treasure.acquired_units == 0

    def test_treasures_relation_reflects_added_treasures(self):
        """Test that the treasures M2M accessor reflects rows added through the through-model."""
        self.game.treasures.add(self.treasure)
        assert list(self.game.treasures.all()) == [self.treasure]

    def test_remove_deletes_the_game_treasure_row(self):
        """Test that removing a treasure from a game deletes the through-row."""
        self.game.treasures.add(self.treasure)
        self.game.treasures.remove(self.treasure)
        assert not GameTreasure.objects.filter(game=self.game, treasure=self.treasure).exists()
