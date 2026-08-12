"""Tests for the GamePossessionPhoto model."""

from django.test import TestCase

from games.models import GamePossessionPhoto
from games.tests.factories import GamePossessionFactory


class TestGamePossessionPhoto(TestCase):
    """Tests for the GamePossessionPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.possession = GamePossessionFactory(name='The Rusty Anchor')

    def test_game_possession_photo_creation(self):
        """Test that a game possession photo can be created and linked to a game possession."""
        photo = GamePossessionPhoto.objects.create(
            path='photos/game_possessions/1/photo.png', game_possession=self.possession,
        )
        assert photo.path == 'photos/game_possessions/1/photo.png'
        assert photo.game_possession == self.possession

    def test_game_possession_photo_str(self):
        """Test string representation of a game possession photo."""
        photo = GamePossessionPhoto(
            path='photos/game_possessions/1/photo.jpg', game_possession=self.possession,
        )
        assert str(photo) == 'photos/game_possessions/1/photo.jpg'

    def test_game_possession_photos_related_name(self):
        """Test that photos can be accessed via the game possession's related name."""
        GamePossessionPhoto.objects.create(
            path='photos/game_possessions/1/photo1.png', game_possession=self.possession,
        )
        GamePossessionPhoto.objects.create(
            path='photos/game_possessions/1/photo2.png', game_possession=self.possession,
        )
        assert self.possession.photos.count() == 2

    def test_deleting_photo_clears_game_possession_photo(self):
        """Test that deleting a game possession's photo sets GamePossession.photo back to None."""
        photo = GamePossessionPhoto.objects.create(
            path='photos/game_possessions/1/photo.png', game_possession=self.possession,
        )
        self.possession.photo = photo
        self.possession.save()

        photo.delete()

        self.possession.refresh_from_db()
        assert self.possession.photo is None
