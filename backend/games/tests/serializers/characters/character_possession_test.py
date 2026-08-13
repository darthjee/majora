"""Tests for the CharacterPossessionSerializer."""

from django.test import TestCase

from games.models import CharacterPossession, GamePossessionPhoto
from games.serializers import CharacterPossessionSerializer
from games.tests.factories import CharacterFactory, GameFactory, GamePossessionFactory


class TestCharacterPossessionSerializer(TestCase):
    """Tests for the CharacterPossessionSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_possession = GamePossessionFactory(
            game=cls.game, name='Bag End', description='A comfortable hobbit-hole.',
        )
        cls.character_possession = CharacterPossession.objects.create(
            character=cls.character, game_possession=cls.game_possession,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized as the CharacterPossession row id."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['id'] == self.character_possession.id

    def test_serializes_game_possession_id(self):
        """Test that game_possession_id is sourced from the related game possession's id."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['game_possession_id'] == self.game_possession.id

    def test_name_is_sourced_from_game_possession_name(self):
        """Test that name is sourced directly from the game possession's name."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['name'] == 'Bag End'

    def test_description_is_sourced_from_game_possession_description(self):
        """Test that description is sourced directly from the game possession's description."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['description'] == 'A comfortable hobbit-hole.'

    def test_photo_path_is_none_without_a_game_possession_photo(self):
        """Test that photo_path is None when the game possession has no photo."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['photo_path'] is None

    def test_photo_path_is_sourced_from_game_possession_photo(self):
        """Test that photo_path is sourced directly from the game possession's photo."""
        photo = GamePossessionPhoto.objects.create(
            game_possession=self.game_possession, path='photos/game_possessions/1/photo.png',
        )
        self.game_possession.photo = photo
        self.game_possession.save()
        data = CharacterPossessionSerializer(self.character_possession).data
        assert data['photo_path'] == 'photos/game_possessions/1/photo.png'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert set(data.keys()) == {
            'id', 'game_possession_id', 'name', 'description', 'photo_path',
        }

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert 'character' not in data

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = CharacterPossessionSerializer(self.character_possession).data
        assert 'hidden' not in data
