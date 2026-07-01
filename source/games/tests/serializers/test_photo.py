"""Tests for the PhotoSerializer."""

import pytest

from games.models import Character, Game, Photo
from games.serializers import PhotoSerializer


@pytest.mark.django_db
class TestPhotoSerializer:

    """Tests for the PhotoSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)
        self.photo = Photo.objects.create(
            url='http://example.com/frodo.png', character=self.character
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = PhotoSerializer(self.photo).data
        assert data['id'] == self.photo.id

    def test_serializes_url(self):
        """Test that the url field is serialized."""
        data = PhotoSerializer(self.photo).data
        assert data['url'] == 'http://example.com/frodo.png'

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = PhotoSerializer(self.photo).data
        assert 'character' not in data
