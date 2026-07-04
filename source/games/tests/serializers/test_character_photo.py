"""Tests for the CharacterPhotoSerializer."""

import pytest

from games.models import Character, CharacterPhoto, Game
from games.serializers import CharacterPhotoSerializer


@pytest.mark.django_db
class TestCharacterPhotoSerializer:

    """Tests for the CharacterPhotoSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)
        self.photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/photo.png', character=self.character
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = CharacterPhotoSerializer(self.photo).data
        assert data['id'] == self.photo.id

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterPhotoSerializer(self.photo).data
        assert 'character' not in data

    def test_serializes_path(self):
        """Test that the path field is serialized."""
        data = CharacterPhotoSerializer(self.photo).data
        assert data['path'] == self.photo.path
