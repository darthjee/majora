"""Tests for the StlModelImportSerializer."""

import pytest

from games.models.base_link import BaseLink
from miniatures.models import StlModel, StlModelLink
from miniatures.serializers import StlModelImportSerializer
from miniatures.tests.factories import StlModelFactory

BASE_DATA = {'name': 'Dragon Miniature', 'source_name': 'Lootstudios'}


@pytest.mark.django_db
class TestStlModelImportSerializer:
    """Tests for the StlModelImportSerializer."""

    def test_creates_new_item_without_external_id(self):
        """Test that a payload without external_id creates a new StlModel."""
        serializer = StlModelImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.name == 'Dragon Miniature'
        assert stl_model.external_id is None
        assert StlModel.objects.count() == 1

    def test_creates_new_item_with_external_id(self):
        """Test that a payload with external_id creates a new StlModel storing it."""
        serializer = StlModelImportSerializer(data={**BASE_DATA, 'external_id': 'ext-1'})
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.external_id == 'ext-1'

    def test_created_item_defaults_to_type_other(self):
        """Test that a newly-created item defaults to type=StlModel.TYPE_OTHER."""
        serializer = StlModelImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.type == StlModel.TYPE_OTHER

    def test_created_item_is_linked_to_resolved_source(self):
        """Test that the newly-created item is linked to the resolved Source."""
        serializer = StlModelImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert list(stl_model.sources.values_list('name', flat=True)) == ['Lootstudios']

    def test_created_item_is_linked_to_resolved_collection(self):
        """Test that the newly-created item is linked to the resolved Collection."""
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'collection_name': 'Monster Pack'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert list(stl_model.collections.values_list('name', flat=True)) == ['Monster Pack']

    def test_update_existing_by_external_id(self):
        """Test that a payload matching an existing external_id updates that StlModel."""
        existing = StlModelFactory(name='Old Name', external_id='ext-1')
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'name': 'New Name', 'external_id': 'ext-1'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.id == existing.id
        assert stl_model.name == 'New Name'
        assert StlModel.objects.count() == 1

    def test_update_existing_by_url_fallback(self):
        """Test that a payload with no external_id match falls back to matching by url."""
        existing = StlModelFactory(name='Old Name', url='https://example.com/model')
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'name': 'New Name', 'url': 'https://example.com/model'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.id == existing.id
        assert stl_model.name == 'New Name'
        assert StlModel.objects.count() == 1

    def test_external_id_match_takes_precedence_over_coincidentally_matching_url(self):
        """Test that the external_id-matched item is found, without even considering url.

        `by_url`'s url is intentionally never sent in the payload: since a `url` is globally
        unique on `StlModel`, actually reassigning it to a different (external_id-matched) item
        in the same request would itself violate that constraint -- an accepted, pre-existing
        limitation, not something this test needs to exercise. What matters here is that
        `_find_stl_model()` never even reaches its url-based fallback once external_id matches.
        """
        by_external_id = StlModelFactory(name='By External Id', external_id='ext-1')
        by_url = StlModelFactory(name='By Url', url='https://example.com/model')

        serializer = StlModelImportSerializer(data={**BASE_DATA, 'external_id': 'ext-1'})
        assert serializer.is_valid()

        found = serializer._find_stl_model()

        assert found.id == by_external_id.id
        assert found.id != by_url.id

    def test_partial_update_does_not_clobber_omitted_fields(self):
        """Test that fields omitted from the payload are left untouched on update."""
        existing = StlModelFactory(
            name='Old Name', external_id='ext-1', url='https://example.com/model',
        )
        serializer = StlModelImportSerializer(
            data={'name': 'New Name', 'source_name': 'Lootstudios', 'external_id': 'ext-1'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.url == 'https://example.com/model'
        assert stl_model.id == existing.id

    def test_lootstudio_link_created_on_first_import(self):
        """Test that a lootstudio StlModelLink is created when url is present."""
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'url': 'https://example.com/model'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        link = StlModelLink.objects.get(
            stl_model=stl_model, link_type=BaseLink.LINK_TYPE_LOOTSTUDIO,
        )
        assert link.url == 'https://example.com/model'

    def test_link_not_duplicated_on_reimport(self):
        """Test that re-importing the same item with the same url doesn't duplicate the link."""
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'external_id': 'ext-1', 'url': 'https://example.com/model'},
        )
        assert serializer.is_valid()
        serializer.save()

        second_serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'external_id': 'ext-1', 'url': 'https://example.com/model'},
        )
        assert second_serializer.is_valid()
        stl_model = second_serializer.save()

        assert StlModelLink.objects.filter(
            stl_model=stl_model, link_type=BaseLink.LINK_TYPE_LOOTSTUDIO,
        ).count() == 1

    def test_link_url_updated_on_reimport_with_new_url(self):
        """Test that re-importing with a new url updates the existing lootstudio link."""
        serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'external_id': 'ext-1', 'url': 'https://example.com/model'},
        )
        assert serializer.is_valid()
        stl_model = serializer.save()

        updated_serializer = StlModelImportSerializer(
            data={**BASE_DATA, 'external_id': 'ext-1', 'url': 'https://example.com/model-v2'},
        )
        assert updated_serializer.is_valid()
        updated_serializer.save()

        link = StlModelLink.objects.get(
            stl_model=stl_model, link_type=BaseLink.LINK_TYPE_LOOTSTUDIO,
        )
        assert link.url == 'https://example.com/model-v2'

    def test_no_link_created_when_url_omitted(self):
        """Test that no StlModelLink is created when url is not sent."""
        serializer = StlModelImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert not StlModelLink.objects.filter(stl_model=stl_model).exists()

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = StlModelImportSerializer(data={'source_name': 'Lootstudios'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_missing_source_name_returns_error(self):
        """Test that a missing source_name is invalid."""
        serializer = StlModelImportSerializer(data={'name': 'Dragon Miniature'})
        assert not serializer.is_valid()
        assert 'source_name' in serializer.errors

    def test_non_http_url_returns_error(self):
        """Test that a non-http(s) url scheme is invalid."""
        serializer = StlModelImportSerializer(data={**BASE_DATA, 'url': 'javascript:alert(1)'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors
