"""Tests for the GameListSerializer."""

import pytest

from games.models import Game
from games.serializers import GameListSerializer


@pytest.mark.django_db
class TestGameListSerializer:
    """Tests for the GameListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(
            name='Test Game', game_slug='test-game', photo='http://example.com/cover.png'
        )

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameListSerializer(self.game).data
        assert data['name'] == 'Test Game'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is serialized."""
        data = GameListSerializer(self.game).data
        assert data['game_slug'] == 'test-game'

    def test_serializes_photo(self):
        """Test that the photo field is serialized."""
        data = GameListSerializer(self.game).data
        assert data['photo'] == 'http://example.com/cover.png'

    def test_does_not_include_description(self):
        """Test that the description field is not exposed."""
        data = GameListSerializer(self.game).data
        assert 'description' not in data

    def test_does_not_include_links(self):
        """Test that the links field is not exposed."""
        data = GameListSerializer(self.game).data
        assert 'links' not in data
