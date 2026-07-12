"""Tests for the GamePhotoSerializer."""

import pytest

from games.models import GamePhoto
from games.serializers import GamePhotoSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestGamePhotoSerializer:
    """Tests for the GamePhotoSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.photo = GamePhoto.objects.create(
            path='photos/games/test-game/game-photo.png', game=self.game
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GamePhotoSerializer(self.photo).data
        assert data['id'] == self.photo.id

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = GamePhotoSerializer(self.photo).data
        assert 'game' not in data

    def test_serializes_path(self):
        """Test that the path field is serialized."""
        data = GamePhotoSerializer(self.photo).data
        assert data['path'] == self.photo.path
