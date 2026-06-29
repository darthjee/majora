"""Tests for the Link model."""

import pytest
from django.contrib.contenttypes.models import ContentType

from games.models import Game, Link


@pytest.mark.django_db
class TestLink:
    """Tests for the Link model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_link_creation(self):
        """Test that a link can be created with a game as content_object."""
        link = Link.objects.create(
            text='Rulebook', url='http://example.com/rules', content_object=self.game
        )
        assert link.text == 'Rulebook'
        assert link.url == 'http://example.com/rules'
        assert link.content_object == self.game

    def test_link_content_type_is_game(self):
        """Test that content_type is set to the ContentType for Game."""
        link = Link.objects.create(
            text='Rulebook', url='http://example.com/rules', content_object=self.game
        )
        game_ct = ContentType.objects.get_for_model(Game)
        assert link.content_type == game_ct

    def test_link_object_id_matches_game(self):
        """Test that object_id matches the game's primary key."""
        link = Link.objects.create(
            text='Rulebook', url='http://example.com/rules', content_object=self.game
        )
        assert link.object_id == self.game.pk

    def test_link_str(self):
        """Test string representation of a link."""
        link = Link(text='Map', url='http://example.com/map', content_object=self.game)
        assert str(link) == 'Map'

    def test_game_links_reverse_relation(self):
        """Test that game.links returns links associated with the game."""
        link = Link.objects.create(
            text='Wiki', url='http://example.com/wiki', content_object=self.game
        )
        assert link in self.game.links.all()
