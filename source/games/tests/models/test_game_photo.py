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
        photo = GamePhoto.objects.create(path='photos/games/test-game/photo.png', game=self.game)
        assert photo.path == 'photos/games/test-game/photo.png'
        assert photo.game == self.game

    def test_game_photo_str(self):
        """Test string representation of a game photo."""
        photo = GamePhoto(path='photos/games/test-game/img.jpg', game=self.game)
        assert str(photo) == 'photos/games/test-game/img.jpg'

    def test_game_photos_related_name(self):
        """Test that photos can be accessed via the game's related name."""
        GamePhoto.objects.create(path='photos/games/test-game/photo1.png', game=self.game)
        GamePhoto.objects.create(path='photos/games/test-game/photo2.png', game=self.game)
        assert self.game.photos.count() == 2

    def test_deleting_cover_photo_clears_game_cover_photo(self):
        """Test that deleting a game's cover photo sets Game.cover_photo back to None."""
        photo = GamePhoto.objects.create(path='photos/games/test-game/cover.png', game=self.game)
        self.game.cover_photo = photo
        self.game.save()

        photo.delete()

        self.game.refresh_from_db()
        assert self.game.cover_photo is None
