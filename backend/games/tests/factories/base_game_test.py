"""Tests for `build_base_game`."""

from django.test import TestCase

from games.tests.factories import BaseGame, build_base_game


class TestBuildBaseGame(TestCase):
    """Tests for the default `build_base_game()` result."""

    @classmethod
    def setUpTestData(cls):
        """Build one base game shared by every test in the class."""
        cls.base = build_base_game()

    def test_returns_base_game(self):
        """Test that the builder returns a BaseGame with the four objects persisted."""
        assert isinstance(self.base, BaseGame)
        for obj in (self.base.game, self.base.dm_user, self.base.dm_player, self.base.domain):
            assert obj.pk is not None

    def test_player_is_the_dm(self):
        """Test that the player is the DM of the game and is linked to the user."""
        assert self.base.dm_player.is_dm
        assert self.base.dm_player.game == self.base.game
        assert self.base.dm_player.user == self.base.dm_user

    def test_game_is_in_the_domain_group(self):
        """Test that the game belongs to the domain's group."""
        groups = self.base.game.game_domain_groups.all()
        assert list(groups) == [self.base.domain.domain_group]

    def test_domain_is_testserver(self):
        """Test that the domain is testserver."""
        assert self.base.domain.domain == 'testserver'

    def test_default_name(self):
        """Test that the default game name is Test Game."""
        assert self.base.game.name == 'Test Game'


class TestBuildBaseGameOverrides(TestCase):
    """Tests for the overrides of `build_base_game`."""

    @classmethod
    def setUpTestData(cls):
        """Build a base game with every override set."""
        cls.base = build_base_game(
            game_name='Custom', game_slug='custom-slug', dm_username='the-dm'
        )

    def test_game_name(self):
        """Test that the game name override applies."""
        assert self.base.game.name == 'Custom'

    def test_game_slug(self):
        """Test that the game slug override applies."""
        assert self.base.game.game_slug == 'custom-slug'

    def test_dm_username(self):
        """Test that the DM username override applies."""
        assert self.base.dm_user.username == 'the-dm'
