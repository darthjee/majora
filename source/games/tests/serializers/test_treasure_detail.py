"""Tests for the TreasureDetailSerializer."""

import pytest

from games.models import Treasure
from games.serializers import TreasureDetailSerializer


@pytest.mark.django_db
class TestTreasureDetailSerializer:
    """Tests for the TreasureDetailSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.treasure = Treasure.objects.create(name='Silver Sword', value=200)

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
        """Test that only id, name, and value are exposed."""
        data = TreasureDetailSerializer(self.treasure).data
        assert set(data.keys()) == {'id', 'name', 'value'}
