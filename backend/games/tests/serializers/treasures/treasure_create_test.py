"""Tests for the TreasureCreateSerializer."""

import pytest

from games.models import Game
from games.serializers import TreasureCreateSerializer


@pytest.mark.django_db
class TestTreasureCreateSerializer:
    """Tests for TreasureCreateSerializer."""

    def test_valid_payload(self):
        """Test that a payload with name and value is valid."""
        serializer = TreasureCreateSerializer(data={'name': 'Golden Crown', 'value': 500})
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.name == 'Golden Crown'
        assert treasure.value == 500

    def test_missing_name_is_invalid(self):
        """Test that a payload without name is invalid."""
        serializer = TreasureCreateSerializer(data={'value': 500})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_missing_value_is_invalid(self):
        """Test that a payload without value is invalid."""
        serializer = TreasureCreateSerializer(data={'name': 'Golden Crown'})
        assert not serializer.is_valid()
        assert 'value' in serializer.errors

    def test_negative_value_is_rejected(self):
        """Test that a negative value fails validation."""
        serializer = TreasureCreateSerializer(data={'name': 'Cursed Coin', 'value': -1})
        assert not serializer.is_valid()
        assert 'value' in serializer.errors

    def test_zero_value_is_valid(self):
        """Test that a value of zero is accepted."""
        serializer = TreasureCreateSerializer(data={'name': 'Worthless Trinket', 'value': 0})
        assert serializer.is_valid()

    def test_hidden_is_not_a_model_field_and_is_ignored(self):
        """Test that a `hidden` payload key is ignored (hidden lives on GameTreasure now)."""
        serializer = TreasureCreateSerializer(
            data={'name': 'Secret Crown', 'value': 500, 'hidden': True}
        )
        assert serializer.is_valid()
        treasure = serializer.save()
        assert not hasattr(treasure, 'hidden')

    def test_game_type_defaults_to_dnd_when_omitted(self):
        """Test that omitting game_type falls back to the model default 'dnd'."""
        serializer = TreasureCreateSerializer(data={'name': 'Golden Crown', 'value': 500})
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.game_type == Game.GAME_TYPE_DND

    def test_game_type_is_persisted_when_given(self):
        """Test that passing game_type='deadlands' persists it."""
        serializer = TreasureCreateSerializer(
            data={'name': 'Bag of Cents', 'value': 500, 'game_type': 'deadlands'}
        )
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.game_type == Game.GAME_TYPE_DEADLANDS
