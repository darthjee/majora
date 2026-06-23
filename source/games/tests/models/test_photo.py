"""Tests for the Photo model."""

import pytest

from games.models import Character, Game, Photo


@pytest.mark.django_db
class TestPhoto:
    """Tests for the Photo model."""

    def test_photo_creation(self):
        """Test that a photo can be created for a character."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        character = Character.objects.create(name='Hero', game=game)
        photo = Photo.objects.create(
            url='http://example.com/photo.png', character=character
        )
        assert photo.url == 'http://example.com/photo.png'
        assert photo.character == character

    def test_photo_str(self):
        """Test string representation of a photo."""
        game = Game.objects.create(name='Test Game 2', game_slug='test-game-2')
        character = Character.objects.create(name='Hero', game=game)
        photo = Photo(url='http://example.com/img.jpg', character=character)
        assert str(photo) == 'http://example.com/img.jpg'
