"""Tests for the StlModelUpdateSerializer."""

import pytest

from miniatures.models import StlModel, StlModelRace, StlModelRole
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

    def test_update_persists_owned_type_url_size(self):
        """Test that update() persists owned/type/url/size."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model,
            data={
                'owned': False, 'type': StlModel.TYPE_TERRAIN,
                'url': 'https://example.com/model', 'size': StlModel.SIZE_HUGE,
            },
            partial=True,
        )
        serializer.is_valid()
        updated = serializer.save()
        assert updated.owned is False
        assert updated.type == StlModel.TYPE_TERRAIN
        assert updated.url == 'https://example.com/model'
        assert updated.size == StlModel.SIZE_HUGE

    def test_update_clears_url_and_size_with_null(self):
        """Test that update() can clear a previously-set url/size back to None."""
        stl_model = StlModelFactory(
            name='Dragon Miniature', url='https://example.com/model', size=StlModel.SIZE_HUGE,
        )
        serializer = StlModelUpdateSerializer(
            stl_model, data={'url': None, 'size': None}, partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.url is None
        assert updated.size is None

    def test_unknown_type_returns_error(self):
        """Test that an unknown type value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(stl_model, data={'type': 'not-a-type'}, partial=True)
        assert not serializer.is_valid()
        assert 'type' in serializer.errors

    def test_unknown_race_returns_error(self):
        """Test that an unknown race value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model, data={'races': ['not-a-race']}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'races' in serializer.errors

    def test_unknown_role_returns_error(self):
        """Test that an unknown role value is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model, data={'roles': ['not-a-role']}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'roles' in serializer.errors

    def test_non_http_url_returns_error(self):
        """Test that a non-http(s) url scheme is invalid."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        serializer = StlModelUpdateSerializer(
            stl_model, data={'url': 'javascript:alert(1)'}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_update_replaces_races_with_given_list(self):
        """Test that update() replaces the STL model's existing races with the given list."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRace.objects.create(stl_model=stl_model, creature=StlModel.RACE_ELF)
        serializer = StlModelUpdateSerializer(
            stl_model, data={'races': [StlModel.RACE_DRAGON]}, partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert set(updated.races.values_list('creature', flat=True)) == {StlModel.RACE_DRAGON}

    def test_update_replaces_roles_with_given_list(self):
        """Test that update() replaces the STL model's existing roles with the given list."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRole.objects.create(stl_model=stl_model, role=StlModel.ROLE_WIZARD)
        serializer = StlModelUpdateSerializer(
            stl_model, data={'roles': [StlModel.ROLE_ARCHER]}, partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert set(updated.roles.values_list('role', flat=True)) == {StlModel.ROLE_ARCHER}

    def test_update_with_empty_races_list_clears_races(self):
        """Test that update() with an empty races list clears all existing races."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRace.objects.create(stl_model=stl_model, creature=StlModel.RACE_ELF)
        serializer = StlModelUpdateSerializer(stl_model, data={'races': []}, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.races.count() == 0

    def test_update_without_races_leaves_existing_races_untouched(self):
        """Test that update() without a races key leaves existing races unchanged."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRace.objects.create(stl_model=stl_model, creature=StlModel.RACE_ELF)
        serializer = StlModelUpdateSerializer(
            stl_model, data={'name': 'Goblin Miniature'}, partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert set(updated.races.values_list('creature', flat=True)) == {StlModel.RACE_ELF}
