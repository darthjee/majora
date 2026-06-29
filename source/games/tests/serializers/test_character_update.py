"""Tests for the CharacterUpdateSerializer."""

import pytest

from games.models import Character, Game
from games.serializers import CharacterUpdateSerializer


@pytest.mark.django_db
class TestCharacterUpdateSerializer:
    """Tests for the CharacterUpdateSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name="Test Game", game_slug="test-game")
        self.character = Character.objects.create(name="Frodo", game=self.game)

    def test_serializes_editable_fields(self):
        """Test that all editable fields are serialized."""
        self.character.role = "Hobbit"
        self.character.public_description = "A brave hobbit."
        self.character.private_description = "Secretly carries the ring."
        self.character.save()
        data = CharacterUpdateSerializer(self.character).data
        assert data["name"] == "Frodo"
        assert data["role"] == "Hobbit"
        assert data["public_description"] == "A brave hobbit."
        assert data["private_description"] == "Secretly carries the ring."

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = CharacterUpdateSerializer(self.character).data
        assert "game" not in data

    def test_does_not_include_id(self):
        """Test that the id field is not exposed."""
        data = CharacterUpdateSerializer(self.character).data
        assert "id" not in data

    def test_all_fields_are_optional(self):
        """Test that a partial payload with a single field is valid."""
        serializer = CharacterUpdateSerializer(
            self.character, data={"role": "Wizard"}, partial=True
        )
        assert serializer.is_valid()

    def test_empty_payload_is_valid(self):
        """Test that an empty payload is valid since all fields are optional."""
        serializer = CharacterUpdateSerializer(self.character, data={}, partial=True)
        assert serializer.is_valid()

    def test_update_applies_only_provided_fields(self):
        """Test that calling save only updates the fields present in validated data."""
        serializer = CharacterUpdateSerializer(
            self.character, data={"name": "Samwise"}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == "Samwise"
        assert updated.game == self.game

    def test_hidden_field_is_writable(self):
        """Test that the hidden field is included and writable."""
        serializer = CharacterUpdateSerializer(self.character, data={"hidden": True}, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.hidden is True

    def test_hidden_field_defaults_to_false(self):
        """Test that hidden is False by default and serialized correctly."""
        data = CharacterUpdateSerializer(self.character).data
        assert data["hidden"] is False
