"""Tests for the Collection model."""

import pytest
from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import Collection
from miniatures.tests.factories import CollectionFactory, CollectionPhotoFactory, SourceFactory


class TestCollection(TestCase):
    """Tests for the Collection model."""

    def test_collection_creation(self):
        """Test that a collection can be created with a name."""
        collection = CollectionFactory(name='Monster Pack')
        assert collection.name == 'Monster Pack'

    def test_collection_str(self):
        """Test string representation of a collection."""
        collection = Collection(name='Terrain Set')
        assert str(collection) == 'Terrain Set'

    def test_name_uniqueness_enforced(self):
        """Test that two collections cannot share the same name."""
        CollectionFactory(name='Monster Pack')
        with pytest.raises(IntegrityError):
            CollectionFactory(name='Monster Pack')

    def test_url_defaults_to_none(self):
        """Test that a collection has no url by default."""
        collection = CollectionFactory(name='Monster Pack')
        assert collection.url is None

    def test_url_can_be_set(self):
        """Test that a collection's url can be set."""
        collection = CollectionFactory(name='Monster Pack', url='https://example.com/pack')
        assert collection.url == 'https://example.com/pack'

    def test_url_uniqueness_enforced(self):
        """Test that two collections cannot share the same non-null url."""
        CollectionFactory(name='Monster Pack', url='https://example.com/pack')
        with pytest.raises(IntegrityError):
            CollectionFactory(name='Terrain Set', url='https://example.com/pack')

    def test_multiple_collections_can_have_no_url(self):
        """Test that multiple collections can each have a null url without colliding."""
        first = CollectionFactory(name='Monster Pack')
        second = CollectionFactory(name='Terrain Set')
        assert first.url is None
        assert second.url is None

    def test_source_defaults_to_none(self):
        """Test that a collection has no source by default."""
        collection = CollectionFactory(name='Monster Pack')
        assert collection.source is None

    def test_source_can_be_set(self):
        """Test that a collection's source can be set."""
        source = SourceFactory(name='MyMiniFactory')
        collection = CollectionFactory(name='Monster Pack', source=source)
        assert collection.source == source

    def test_deleting_source_clears_collection_source(self):
        """Test that deleting a collection's source sets Collection.source back to None."""
        source = SourceFactory(name='MyMiniFactory')
        collection = CollectionFactory(name='Monster Pack', source=source)

        source.delete()

        collection.refresh_from_db()
        assert collection.source is None

    def test_photo_defaults_to_none(self):
        """Test that a collection has no photo by default."""
        collection = CollectionFactory(name='Monster Pack')
        assert collection.photo is None

    def test_deleting_photo_clears_collection_photo(self):
        """Test that deleting a collection's photo sets Collection.photo back to None."""
        collection = CollectionFactory(name='Monster Pack')
        photo = CollectionPhotoFactory(collection=collection)
        collection.photo = photo
        collection.save()

        photo.delete()

        collection.refresh_from_db()
        assert collection.photo is None
