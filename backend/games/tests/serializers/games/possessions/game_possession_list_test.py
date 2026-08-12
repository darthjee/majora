"""Tests for the GamePossessionListSerializer/GamePossessionAllListSerializer."""

from django.test import TestCase

from games.models import GamePossessionPhoto
from games.serializers import GamePossessionAllListSerializer, GamePossessionListSerializer
from games.tests.factories import GamePossessionFactory


class TestGamePossessionListSerializer(TestCase):
    """Tests for the GamePossessionListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.possession = GamePossessionFactory(
            name='The Rusty Anchor', description='A cozy tavern by the docks.',
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GamePossessionListSerializer(self.possession).data
        assert data['id'] == self.possession.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GamePossessionListSerializer(self.possession).data
        assert data['name'] == 'The Rusty Anchor'

    def test_does_not_include_description(self):
        """Test that description is not exposed by the index serializer."""
        data = GamePossessionListSerializer(self.possession).data
        assert 'description' not in data

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GamePossessionListSerializer(self.possession).data
        assert set(data.keys()) == {'id', 'name', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the game possession has no photo."""
        data = GamePossessionListSerializer(self.possession).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GamePossessionPhoto is attached."""
        photo = GamePossessionPhoto.objects.create(
            game_possession=self.possession, path='photos/game_possessions/1/photo.png',
        )
        self.possession.photo = photo
        self.possession.save()
        data = GamePossessionListSerializer(self.possession).data
        assert data['photo_path'] == 'photos/game_possessions/1/photo.png'

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = GamePossessionListSerializer(self.possession).data
        assert 'hidden' not in data


class TestGamePossessionAllListSerializer(TestCase):
    """Tests for the GamePossessionAllListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.possession = GamePossessionFactory(name='The Rusty Anchor')

    def test_includes_hidden_field_alongside_list_fields(self):
        """Test that the serializer exposes every GamePossessionListSerializer field plus hidden."""
        data = GamePossessionAllListSerializer(self.possession).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_game_possession_own_field(self):
        """Test that hidden reflects the game possession's own hidden field."""
        self.possession.hidden = True
        self.possession.save()
        data = GamePossessionAllListSerializer(self.possession).data
        assert data['hidden'] is True
