"""Tests for the TreasureListSerializer."""

import pytest

from games.models import Treasure
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
        """Test that only id, name, and value are exposed."""
        data = TreasureListSerializer(self.treasure).data
        assert set(data.keys()) == {'id', 'name', 'value'}
