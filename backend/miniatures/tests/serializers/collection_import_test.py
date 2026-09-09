"""Tests for the CollectionImportSerializer."""

import pytest

from miniatures.models import Collection, Source
from miniatures.serializers import CollectionImportSerializer
from miniatures.serializers._crawler_import_sync import CollectionSync
from miniatures.tests.factories import CollectionFactory, SourceFactory

BASE_DATA = {'name': 'Monster Pack', 'source_name': 'Lootstudios'}


@pytest.mark.django_db
class TestCollectionImportSerializer:
    """Tests for the CollectionImportSerializer."""

    def test_creates_new_collection(self):
        """Test that a valid payload creates a new Collection."""
        serializer = CollectionImportSerializer(
            data={**BASE_DATA, 'external_id': 'ext-1', 'url': 'https://example.com/collection'},
        )
        assert serializer.is_valid()
        collection = serializer.save()
        assert collection.name == 'Monster Pack'
        assert collection.external_id == 'ext-1'
        assert collection.url == 'https://example.com/collection'
        assert serializer.created is True
        assert Collection.objects.count() == 1

    def test_resolves_and_creates_source(self):
        """Test that a valid payload resolves/creates the named Source."""
        serializer = CollectionImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()
        collection = serializer.save()
        assert collection.source.name == 'Lootstudios'
        assert Source.objects.filter(name='Lootstudios').count() == 1

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = CollectionImportSerializer(data={'source_name': 'Lootstudios'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_missing_source_name_returns_error(self):
        """Test that a missing source_name is invalid."""
        serializer = CollectionImportSerializer(data={'name': 'Monster Pack'})
        assert not serializer.is_valid()
        assert 'source_name' in serializer.errors

    def test_omitted_external_id_and_url_are_valid(self):
        """Test that external_id and url are optional."""
        serializer = CollectionImportSerializer(data=BASE_DATA)
        assert serializer.is_valid()

    def test_update_existing_by_external_id(self):
        """Test that a payload matching by external_id updates name/url and reassigns source."""
        existing = CollectionFactory(
            name='Old Name', external_id='ext-1', url='https://example.com/old',
        )
        serializer = CollectionImportSerializer(
            data={
                'name': 'New Name', 'source_name': 'Lootstudios', 'external_id': 'ext-1',
                'url': 'https://example.com/new',
            },
        )
        assert serializer.is_valid()
        collection = serializer.save()
        assert collection.id == existing.id
        assert collection.name == 'New Name'
        assert collection.url == 'https://example.com/new'
        assert collection.source.name == 'Lootstudios'
        assert serializer.created is False
        assert Collection.objects.count() == 1

    def test_update_existing_by_name_fallback(self):
        """Test that a payload with no external_id matches an existing Collection by name."""
        existing = CollectionFactory(name='Monster Pack', url='https://example.com/old')
        serializer = CollectionImportSerializer(
            data={**BASE_DATA, 'url': 'https://example.com/new'},
        )
        assert serializer.is_valid()
        collection = serializer.save()
        assert collection.id == existing.id
        assert collection.url == 'https://example.com/new'
        assert serializer.created is False
        assert Collection.objects.count() == 1

    def test_stub_then_fill_sequence(self):
        """Test that filling in a stub created by external_id alone doesn't duplicate the row."""
        source = SourceFactory(name='Lootstudios')
        stub = CollectionSync(source=source, external_id='ext-1').resolve()
        assert stub.name == 'ext-1'

        serializer = CollectionImportSerializer(
            data={
                'name': 'Monster Pack', 'source_name': 'Lootstudios', 'external_id': 'ext-1',
                'url': 'https://example.com/collection',
            },
        )
        assert serializer.is_valid()
        collection = serializer.save()

        assert collection.id == stub.id
        assert collection.name == 'Monster Pack'
        assert collection.url == 'https://example.com/collection'
        assert Collection.objects.count() == 1
