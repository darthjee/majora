"""Tests for the Link model."""

import pytest

from games.models import Game, Link


@pytest.mark.django_db
class TestLink:
    """Tests for the Link model."""

    def test_link_creation(self):
        """Test that a link can be created for a game."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        link = Link.objects.create(
            text='Rulebook', url='http://example.com/rules', game=game
        )
        assert link.text == 'Rulebook'
        assert link.url == 'http://example.com/rules'
        assert link.game == game

    def test_link_str(self):
        """Test string representation of a link."""
        game = Game.objects.create(name='Test Game 3', game_slug='test-game-3')
        link = Link(text='Map', url='http://example.com/map', game=game)
        assert str(link) == 'Map'
