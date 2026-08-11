"""Tests for the StlModelUpdateSerializer."""

import pytest

from miniatures.models import StlModel
from miniatures.serializers import StlModelUpdateSerializer
from miniatures.tests.factories import StlModelFactory


@pytest.mark.django_db
class TestStlModelUpdateSerializer:
    """Tests for the StlModelUpdateSerializer."""

    def test_valid_with_empty_payload(self):
        """Test that an empty payload is valid (all fields optional)."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(stl_model, data={}, partial=True)
        assert serializer.is_valid()

    def test_update_persists_name(self):
        """Test that update() persists a new name."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model, data={'name': 'Goblin Miniature'}, partial=True,
        )
        serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Goblin Miniature'

    def test_update_persists_owned_type_race_role(self):
        """Test that update() persists owned/type/race/role."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model,
            data={
                'owned': False, 'type': StlModel.TYPE_TERRAIN, 'race': StlModel.RACE_ELF,
                'role': StlModel.ROLE_WIZARD,
            },
            partial=True,
        )
        serializer.is_valid()
        updated = serializer.save()
        assert updated.owned is False
        assert updated.type == StlModel.TYPE_TERRAIN
        assert updated.race == StlModel.RACE_ELF
        assert updated.role == StlModel.ROLE_WIZARD

    def test_update_clears_race_and_role_with_null(self):
        """Test that update() can clear a previously-set race/role back to None."""
        stl_model = StlModelFactory(
            name='Dragon Miniature', race=StlModel.RACE_ELF, role=StlModel.ROLE_WIZARD,
        )
        serializer = StlModelUpdateSerializer(
            stl_model, data={'race': None, 'role': None}, partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.race is None
        assert updated.role is None

    def test_unknown_type_returns_error(self):
        """Test that an unknown type value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(stl_model, data={'type': 'not-a-type'}, partial=True)
        assert not serializer.is_valid()
        assert 'type' in serializer.errors

    def test_unknown_race_returns_error(self):
        """Test that an unknown race value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(stl_model, data={'race': 'not-a-race'}, partial=True)
        assert not serializer.is_valid()
        assert 'race' in serializer.errors

    def test_unknown_role_returns_error(self):
        """Test that an unknown role value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(stl_model, data={'role': 'not-a-role'}, partial=True)
        assert not serializer.is_valid()
        assert 'role' in serializer.errors
