"""Tests for the GamePhoto model."""

import pytest

from games.models import Game, GamePhoto


@pytest.mark.django_db
class TestGamePhoto:
    """Tests for the GamePhoto model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_game_photo_creation(self):
        """Test that a game photo can be created and linked to a game."""
        photo = GamePhoto.objects.create(url='http://example.com/photo.png', game=self.game)
        assert photo.url == 'http://example.com/photo.png'
        assert photo.game == self.game

    def test_game_photo_str(self):
        """Test string representation of a game photo."""
        photo = GamePhoto(url='http://example.com/img.jpg', game=self.game)
        assert str(photo) == 'http://example.com/img.jpg'

    def test_game_photos_related_name(self):
        """Test that photos can be accessed via the game's related name."""
        GamePhoto.objects.create(url='http://example.com/photo1.png', game=self.game)
        GamePhoto.objects.create(url='http://example.com/photo2.png', game=self.game)
        assert self.game.photos.count() == 2
