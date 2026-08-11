"""Tests for the CollectionDetailSerializer."""

import pytest

from miniatures.serializers import CollectionDetailSerializer
from miniatures.tests.factories import (
    CollectionFactory,
    CollectionPhotoFactory,
    SourceFactory,
    StlModelFactory,
)


@pytest.mark.django_db
class TestCollectionDetailSerializer:
    """Tests for the CollectionDetailSerializer."""

    def test_returns_id_name_url_photo_url(self):
        """Test that id, name, url, and photo_url are returned."""
        collection = CollectionFactory(name='Monster Pack', url='https://example.com/pack')
        photo = CollectionPhotoFactory(
            collection=collection, path='photos/collections/1/photo.png',
        )
        collection.photo = photo
        collection.save()

        data = CollectionDetailSerializer(collection).data
        assert data['id'] == collection.id
        assert data['name'] == 'Monster Pack'
        assert data['url'] == 'https://example.com/pack'
        assert data['photo_url'] == 'photos/collections/1/photo.png'

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        collection = CollectionFactory(name='Monster Pack')
        data = CollectionDetailSerializer(collection).data
        assert data['photo_url'] is None

    def test_url_is_none_by_default(self):
        """Test that url is None when not set."""
        collection = CollectionFactory(name='Monster Pack')
        data = CollectionDetailSerializer(collection).data
        assert data['url'] is None

    def test_source_is_none_without_a_source(self):
        """Test that source resolves to None when no source is set."""
        collection = CollectionFactory(name='Monster Pack')
        data = CollectionDetailSerializer(collection).data
        assert data['source'] is None

    def test_source_returns_id_and_name(self):
        """Test that source is nested as id and name when set."""
        source = SourceFactory(name='MyMiniFactory')
        collection = CollectionFactory(name='Monster Pack', source=source)
        data = CollectionDetailSerializer(collection).data
        assert data['source'] == {'id': source.id, 'name': 'MyMiniFactory'}

    def test_stl_models_defaults_to_empty_list(self):
        """Test that stl_models is an empty list when no stl_models are linked."""
        collection = CollectionFactory(name='Monster Pack')
        data = CollectionDetailSerializer(collection).data
        assert data['stl_models'] == []

    def test_stl_models_returns_id_and_name(self):
        """Test that stl_models are nested as id and name when linked."""
        collection = CollectionFactory(name='Monster Pack')
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.collections.add(collection)

        data = CollectionDetailSerializer(collection).data
        assert data['stl_models'] == [{'id': stl_model.id, 'name': 'Dragon Miniature'}]
