"""Tests for the PlayerCharacterSerializer."""

from django.test import TestCase

from games.models import CharacterPhoto
from games.serializers.games.players.player_character import PlayerCharacterSerializer
from games.tests.factories import CharacterFactory, GameFactory


class TestPlayerCharacterSerializer(TestCase):
    """Tests for the PlayerCharacterSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a PC."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=False)

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = PlayerCharacterSerializer(self.character).data
        assert data['name'] == 'Frodo'

    def test_serializes_photo_url_as_none_when_unset(self):
        """Test that photo_url is None when the character has no profile photo."""
        data = PlayerCharacterSerializer(self.character).data
        assert data['photo_url'] is None

    def test_serializes_photo_url_when_set(self):
        """Test that photo_url equals the profile photo's path when set."""
        photo = CharacterPhoto.objects.create(
            path='photos/games/test-game/characters/1/profile.jpg', character=self.character
        )
        self.character.profile_photo = photo
        self.character.save()
        data = PlayerCharacterSerializer(self.character).data
        assert data['photo_url'] == 'photos/games/test-game/characters/1/profile.jpg'

    def test_does_not_include_other_fields(self):
        """Test that only name and photo_url are exposed."""
        data = PlayerCharacterSerializer(self.character).data
        assert set(data.keys()) == {'name', 'photo_url'}
