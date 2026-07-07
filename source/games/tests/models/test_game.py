"""Tests for the Game model."""

import pytest
from django.contrib.auth.models import AnonymousUser
from django.utils.text import slugify

from games.models import Game
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


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


@pytest.mark.django_db
class TestGameCanBeEditedBy:
    """Tests for Game.can_be_edited_by()."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)

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
