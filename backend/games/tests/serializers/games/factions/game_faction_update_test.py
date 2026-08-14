"""Tests for the GameFactionUpdateSerializer."""

from django.test import TestCase

from games.serializers import GameFactionUpdateSerializer
from games.tests.factories import GameFactionFactory, GameFactory


class TestGameFactionUpdateSerializer(TestCase):
    """Tests for GameFactionUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a faction instance for testing."""
        cls.faction = GameFactionFactory(name='The Silver Hand')

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = GameFactionUpdateSerializer(
            self.faction, data={'name': 'The Golden Hand'}, partial=True,
        )
        assert serializer.is_valid()
        faction = serializer.save()
        assert faction.name == 'The Golden Hand'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameFactionUpdateSerializer(self.faction, data={}, partial=True)
        assert serializer.is_valid()

    def test_blank_name_is_rejected(self):
        """Test that a blank name is rejected — GameFaction has no fallback target."""
        serializer = GameFactionUpdateSerializer(self.faction, data={'name': ''}, partial=True)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_invalid_name_too_long(self):
        """Test that a name exceeding max_length is rejected."""
        serializer = GameFactionUpdateSerializer(
            self.faction, data={'name': 'x' * 201}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_game_and_id_are_not_included(self):
        """Test that game and id are not fields in the serializer."""
        other_game = GameFactory()
        original_game_id = self.faction.game_id
        serializer = GameFactionUpdateSerializer(
            self.faction,
            data={'name': 'New Name', 'game': other_game.id, 'id': 999},
            partial=True,
        )
        assert serializer.is_valid()
        faction = serializer.save()
        assert faction.name == 'New Name'
        assert faction.game_id == original_game_id
        assert faction.id != 999
