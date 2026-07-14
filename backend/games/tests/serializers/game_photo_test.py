"""Tests for the GamePhotoSerializer."""

from django.test import TestCase

from games.models import GamePhoto
from games.serializers import GamePhotoSerializer
from games.tests.factories import GameFactory


class TestGamePhotoSerializer(TestCase):
    """Tests for the GamePhotoSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.photo = GamePhoto.objects.create(
            path='photos/games/test-game/game-photo.png', game=cls.game
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
