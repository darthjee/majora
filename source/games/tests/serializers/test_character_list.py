"""Tests for the CharacterListSerializer."""

import pytest

from games.models import Character, CharacterPhoto, Game
from games.serializers import CharacterListSerializer


@pytest.mark.django_db
class TestCharacterListSerializer:
    """Tests for the CharacterListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = CharacterListSerializer(self.character).data
        assert data['id'] == self.character.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = CharacterListSerializer(self.character).data
        assert data['name'] == 'Frodo'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is sourced from the related game."""
        data = CharacterListSerializer(self.character).data
        assert data['game_slug'] == 'test-game'

    def test_does_not_include_public_description(self):
        """Test that the public_description field is not exposed."""
        data = CharacterListSerializer(self.character).data
        assert 'public_description' not in data

    def test_serializes_profile_photo_path_as_none_when_unset(self):
        """Test that profile_photo_path is null when the character has no profile photo."""
        data = CharacterListSerializer(self.character).data
        assert data['profile_photo_path'] is None

    def test_serializes_profile_photo_path_when_set(self):
        """Test that profile_photo_path equals the profile photo's path when set."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.jpg', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()
        data = CharacterListSerializer(self.character).data
        assert data['profile_photo_path'] == 'photos/games/test-game/characters/1/profile.jpg'
