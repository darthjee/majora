"""Tests for the TreasureListSerializer."""

import pytest

from games.models import Game, Treasure, TreasurePhoto
from games.serializers import TreasureListSerializer


@pytest.mark.django_db
class TestTreasureListSerializer:
    """Tests for the TreasureListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.treasure = Treasure.objects.create(name='Golden Crown', value=500)

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = TreasureListSerializer(self.treasure).data
        assert data['id'] == self.treasure.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = TreasureListSerializer(self.treasure).data
        assert data['name'] == 'Golden Crown'

    def test_serializes_value(self):
        """Test that the value field is serialized."""
        data = TreasureListSerializer(self.treasure).data
        assert data['value'] == 500

    def test_only_exposes_expected_fields(self):
        """Test that only id, name, value, photo_path, and game_slug are exposed."""
        data = TreasureListSerializer(self.treasure).data
        assert set(data.keys()) == {'id', 'name', 'value', 'photo_path', 'game_slug'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the treasure has no photo."""
        data = TreasureListSerializer(self.treasure).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a TreasurePhoto is attached."""
        photo = TreasurePhoto.objects.create(
            treasure=self.treasure, path='photos/treasures/1/photo.png'
        )
        self.treasure.photo = photo
        self.treasure.save()
        data = TreasureListSerializer(self.treasure).data
        assert data['photo_path'] == 'photos/treasures/1/photo.png'

    def test_game_slug_is_none_without_owning_game(self):
        """Test that game_slug is None when the treasure has no owning game."""
        data = TreasureListSerializer(self.treasure).data
        assert data['game_slug'] is None

    def test_game_slug_reflects_owning_game(self):
        """Test that game_slug reflects the owning game's slug when set."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.treasure.game = game
        self.treasure.save()
        data = TreasureListSerializer(self.treasure).data
        assert data['game_slug'] == 'test-game'
