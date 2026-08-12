"""Tests for the GamePossessionUpdateSerializer."""

from django.test import TestCase

from games.serializers import GamePossessionUpdateSerializer
from games.tests.factories import GameFactory, GamePossessionFactory


class TestGamePossessionUpdateSerializer(TestCase):
    """Tests for GamePossessionUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game possession instance for testing."""
        cls.possession = GamePossessionFactory(
            name='The Rusty Anchor', description='A cozy tavern.', hidden=False,
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = GamePossessionUpdateSerializer(
            self.possession, data={'name': 'The Golden Anchor'}, partial=True,
        )
        assert serializer.is_valid()
        possession = serializer.save()
        assert possession.name == 'The Golden Anchor'

    def test_valid_partial_description_update(self):
        """Test that a partial update with only description is valid."""
        serializer = GamePossessionUpdateSerializer(
            self.possession, data={'description': 'A finer tavern.'}, partial=True,
        )
        assert serializer.is_valid()
        possession = serializer.save()
        assert possession.description == 'A finer tavern.'

    def test_valid_partial_hidden_update(self):
        """Test that a partial update with only hidden leaves name/description untouched."""
        serializer = GamePossessionUpdateSerializer(
            self.possession, data={'hidden': True}, partial=True,
        )
        assert serializer.is_valid()
        possession = serializer.save()
        assert possession.hidden is True
        assert possession.name == 'The Rusty Anchor'
        assert possession.description == 'A cozy tavern.'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GamePossessionUpdateSerializer(self.possession, data={}, partial=True)
        assert serializer.is_valid()

    def test_blank_name_is_rejected(self):
        """Test that a blank name is rejected — GamePossession has no fallback target."""
        serializer = GamePossessionUpdateSerializer(
            self.possession, data={'name': ''}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_invalid_name_too_long(self):
        """Test that a name exceeding max_length is rejected."""
        serializer = GamePossessionUpdateSerializer(
            self.possession, data={'name': 'x' * 201}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_game_and_id_are_not_included(self):
        """Test that game and id are not fields in the serializer."""
        other_game = GameFactory()
        original_game_id = self.possession.game_id
        serializer = GamePossessionUpdateSerializer(
            self.possession,
            data={'name': 'New Name', 'game': other_game.id, 'id': 999},
            partial=True,
        )
        assert serializer.is_valid()
        possession = serializer.save()
        assert possession.name == 'New Name'
        assert possession.game_id == original_game_id
        assert possession.id != 999
