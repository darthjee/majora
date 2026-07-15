"""Tests for the TreasureDetailSerializer."""

from django.test import TestCase

from games.models import GameTreasure, TreasurePhoto
from games.serializers import TreasureDetailSerializer
from games.tests.factories import GameFactory, TreasureFactory


class TestTreasureDetailSerializer(TestCase):
    """Tests for the TreasureDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.treasure = TreasureFactory(name='Silver Sword', value=200)

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['id'] == self.treasure.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['name'] == 'Silver Sword'

    def test_serializes_value(self):
        """Test that the value field is serialized."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['value'] == 200

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = TreasureDetailSerializer(self.treasure).data
        assert set(data.keys()) == {
            'id', 'name', 'value', 'game_type', 'photo_path', 'game_slug', 'available_units',
            'max_units',
        }

    def test_serializes_game_type(self):
        """Test that the game_type field is serialized."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['game_type'] == 'dnd'

    def test_serializes_deadlands_game_type(self):
        """Test that a deadlands treasure serializes its own game_type."""
        self.treasure.game_type = 'deadlands'
        self.treasure.save()
        data = TreasureDetailSerializer(self.treasure).data
        assert data['game_type'] == 'deadlands'

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the treasure has no photo."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a TreasurePhoto is attached."""
        photo = TreasurePhoto.objects.create(
            treasure=self.treasure, path='photos/treasures/1/photo.png'
        )
        self.treasure.photo = photo
        self.treasure.save()
        data = TreasureDetailSerializer(self.treasure).data
        assert data['photo_path'] == 'photos/treasures/1/photo.png'

    def test_game_slug_is_none_without_owning_game(self):
        """Test that game_slug is None when the treasure has no owning game."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['game_slug'] is None

    def test_game_slug_reflects_owning_game(self):
        """Test that game_slug reflects the owning game's slug when set."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        self.treasure.game = game
        self.treasure.save()
        data = TreasureDetailSerializer(self.treasure).data
        assert data['game_slug'] == 'test-game'

    def test_available_units_and_max_units_are_none_without_game_context(self):
        """Test that available_units/max_units are None when no game is in context."""
        data = TreasureDetailSerializer(self.treasure).data
        assert data['available_units'] is None
        assert data['max_units'] is None

    def test_available_units_and_max_units_are_none_when_treasure_not_linked(self):
        """Test that available_units/max_units are None when the treasure has no game link."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        data = TreasureDetailSerializer(self.treasure, context={'game': game}).data
        assert data['available_units'] is None
        assert data['max_units'] is None

    def test_available_units_and_max_units_reflect_the_game_treasure_row(self):
        """Test that available_units/max_units reflect the linked GameTreasure row."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        game.treasures.add(self.treasure)
        GameTreasure.objects.filter(game=game, treasure=self.treasure).update(
            max_units=10, acquired_units=4,
        )
        data = TreasureDetailSerializer(self.treasure, context={'game': game}).data
        assert data['max_units'] == 10
        assert data['available_units'] == 6

    def test_max_units_is_none_when_unlimited(self):
        """Test that max_units/available_units are None when the game treasure is unlimited."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        game.treasures.add(self.treasure)
        data = TreasureDetailSerializer(self.treasure, context={'game': game}).data
        assert data['max_units'] is None
        assert data['available_units'] is None
