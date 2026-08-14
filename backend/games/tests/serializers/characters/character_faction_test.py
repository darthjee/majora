"""Tests for the CharacterFactionSerializer."""

from django.test import TestCase

from games.models import CharacterFaction, GameFactionPhoto
from games.serializers import CharacterFactionSerializer
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


class TestCharacterFactionSerializer(TestCase):
    """Tests for the CharacterFactionSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_faction = GameFactionFactory(game=cls.game, name='The Silver Hand')
        cls.character_faction = CharacterFaction.objects.create(
            character=cls.character, game_faction=cls.game_faction,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized as the CharacterFaction row id."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert data['id'] == self.character_faction.id

    def test_serializes_game_faction_id(self):
        """Test that game_faction_id is sourced from the related game faction's id."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert data['game_faction_id'] == self.game_faction.id

    def test_name_is_sourced_from_game_faction_name(self):
        """Test that name is sourced directly from the game faction's name."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert data['name'] == 'The Silver Hand'

    def test_photo_path_is_none_without_a_game_faction_photo(self):
        """Test that photo_path is None when the game faction has no photo."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert data['photo_path'] is None

    def test_photo_path_is_sourced_from_game_faction_photo(self):
        """Test that photo_path is sourced directly from the game faction's photo."""
        photo = GameFactionPhoto.objects.create(
            faction=self.game_faction, path='photos/game_factions/1/photo.png',
        )
        self.game_faction.photo = photo
        self.game_faction.save()
        data = CharacterFactionSerializer(self.character_faction).data
        assert data['photo_path'] == 'photos/game_factions/1/photo.png'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert set(data.keys()) == {'id', 'game_faction_id', 'name', 'photo_path'}

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert 'character' not in data

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = CharacterFactionSerializer(self.character_faction).data
        assert 'hidden' not in data
