"""Tests for the GameFactionCharacterSerializer."""

from django.test import TestCase

from games.models import CharacterPhoto
from games.serializers import GameFactionCharacterSerializer
from games.tests.factories import CharacterFactory, GameFactory


class TestGameFactionCharacterSerializer(TestCase):
    """Tests for the GameFactionCharacterSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_serializes_id_name_and_type_for_a_pc(self):
        """Test that a PC serializes with type 'pc'."""
        character = CharacterFactory(name='Frodo', game=self.game, npc=False)
        data = GameFactionCharacterSerializer(character).data
        assert data['id'] == character.id
        assert data['name'] == 'Frodo'
        assert data['type'] == 'pc'

    def test_serializes_type_npc_for_an_npc(self):
        """Test that an NPC serializes with type 'npc'."""
        character = CharacterFactory(name='Sauron', game=self.game, npc=True)
        data = GameFactionCharacterSerializer(character).data
        assert data['type'] == 'npc'

    def test_photo_path_is_none_without_a_photo(self):
        """Test that photo_path is None when the character has no photo."""
        character = CharacterFactory(name='Frodo', game=self.game)
        data = GameFactionCharacterSerializer(character).data
        assert data['photo_path'] is None

    def test_photo_path_is_sourced_from_the_character_photo(self):
        """Test that photo_path is sourced directly from the character's own photo."""
        character = CharacterFactory(name='Frodo', game=self.game)
        photo = CharacterPhoto.objects.create(
            character=character, path='photos/characters/1/photo.png',
        )
        character.photo = photo
        character.save()
        data = GameFactionCharacterSerializer(character).data
        assert data['photo_path'] == 'photos/characters/1/photo.png'

    def test_photo_path_is_none_when_incognito(self):
        """Test that photo_path is None for an incognito character, even with a photo set."""
        character = CharacterFactory(name='Frodo', game=self.game, incognito=True)
        photo = CharacterPhoto.objects.create(
            character=character, path='photos/characters/1/photo.png',
        )
        character.photo = photo
        character.save()
        data = GameFactionCharacterSerializer(character).data
        assert data['photo_path'] is None

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        character = CharacterFactory(name='Frodo', game=self.game)
        data = GameFactionCharacterSerializer(character).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'type'}
