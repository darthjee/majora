"""Tests for the CharacterPhotoSerializer."""

from django.test import TestCase

from games.models import CharacterPhoto
from games.serializers import CharacterPhotoSerializer
from games.tests.factories import CharacterFactory, GameFactory


class TestCharacterPhotoSerializer(TestCase):
    """Tests for the CharacterPhotoSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/photo.png', character=cls.character
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
