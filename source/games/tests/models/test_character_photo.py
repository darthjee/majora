"""Tests for the CharacterPhoto model."""

import pytest

from games.models import Character, CharacterPhoto, Game


@pytest.mark.django_db
class TestCharacterPhoto:
    """Tests for the CharacterPhoto model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)

    def test_character_photo_creation(self):
        """Test that a character photo can be created and linked to a character."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/photo.png', character=self.character
        )
        assert photo.path == 'photos/games/test-game/characters/1/photo.png'
        assert photo.character == self.character

    def test_character_photo_str(self):
        """Test string representation of a character photo."""
        photo = CharacterPhoto(
            path='photos/games/test-game/characters/1/img.jpg', character=self.character
        )
        assert str(photo) == 'photos/games/test-game/characters/1/img.jpg'

    def test_character_photos_related_name(self):
        """Test that photos can be accessed via the character's related name."""
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/photo1.png', character=self.character
        )
        CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/photo2.png', character=self.character
        )
        assert self.character.photos.count() == 2

    def test_deleting_profile_photo_clears_character_profile_photo(self):
        """Test that deleting a character's profile photo sets Character.profile_photo to None."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.png', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()

        photo.delete()

        self.character.refresh_from_db()
        assert self.character.profile_photo is None
