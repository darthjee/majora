"""Tests for the GamePossessionDetailSerializer/GamePossessionDetailFullSerializer."""

from django.test import TestCase

from games.serializers import GamePossessionDetailFullSerializer, GamePossessionDetailSerializer
from games.tests.factories import GamePossessionFactory


class TestGamePossessionDetailSerializer(TestCase):
    """Tests for the GamePossessionDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.possession = GamePossessionFactory(
            name='The Rusty Anchor', description='A cozy tavern by the docks.',
        )

    def test_serializes_description(self):
        """Test that the description field is serialized."""
        data = GamePossessionDetailSerializer(self.possession).data
        assert data['description'] == 'A cozy tavern by the docks.'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GamePossessionDetailSerializer(self.possession).data
        assert set(data.keys()) == {'id', 'name', 'description', 'photo_path'}


class TestGamePossessionDetailFullSerializer(TestCase):
    """Tests for the GamePossessionDetailFullSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.possession = GamePossessionFactory(
            name='The Rusty Anchor', description='A cozy tavern by the docks.',
        )

    def test_includes_hidden_field_alongside_detail_fields(self):
        """Test that the serializer exposes every GamePossessionDetailSerializer field."""
        data = GamePossessionDetailFullSerializer(self.possession).data
        assert set(data.keys()) == {'id', 'name', 'description', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_game_possession_own_field(self):
        """Test that hidden reflects the game possession's own hidden field."""
        self.possession.hidden = True
        self.possession.save()
        data = GamePossessionDetailFullSerializer(self.possession).data
        assert data['hidden'] is True
