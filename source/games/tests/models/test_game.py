"""Tests for the Game model."""

import pytest
from django.utils.text import slugify

from games.models import Game


@pytest.mark.django_db
class TestGame:
    """Tests for the Game model."""

    def test_game_creation(self):
        """Test that a game can be created with name and game_slug."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
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

        Game.objects.create(name='Game One', game_slug='same-slug')
        with pytest.raises(IntegrityError):
            Game.objects.create(name='Game Two', game_slug='same-slug')

    def test_game_str(self):
        """Test string representation of a game."""
        game = Game(name='My Game', game_slug='my-game')
        assert str(game) == 'My Game'

    def test_game_ordering(self):
        """Test that games are ordered by id."""
        first = Game.objects.create(name='Zebra Game', game_slug='zebra-game')
        second = Game.objects.create(name='Alpha Game', game_slug='alpha-game')
        games = list(Game.objects.all())
        assert games[0].id == first.id
        assert games[1].id == second.id
