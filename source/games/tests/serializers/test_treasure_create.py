"""Tests for the TreasureCreateSerializer."""

import pytest

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
