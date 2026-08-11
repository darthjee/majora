"""Tests for the CollectionListSerializer."""

import pytest

from miniatures.serializers import CollectionListSerializer
from miniatures.tests.factories import CollectionFactory, CollectionPhotoFactory, StlModelFactory


@pytest.mark.django_db
class TestCollectionListSerializer:
    """Tests for the CollectionListSerializer."""

    def test_returns_id_name_photo_url_stl_model_count(self):
        """Test that id, name, photo_url, and stl_model_count are returned."""
        collection = CollectionFactory(name='Monster Pack')
        photo = CollectionPhotoFactory(
            collection=collection, path='photos/collections/1/photo.png',
        )
        collection.photo = photo
        collection.save()

        data = CollectionListSerializer(collection).data
        assert data == {
            'id': collection.id,
            'name': 'Monster Pack',
            'photo_url': 'photos/collections/1/photo.png',
            'stl_model_count': 0,
        }

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        collection = CollectionFactory(name='Monster Pack')
        data = CollectionListSerializer(collection).data
        assert data['photo_url'] is None

    def test_stl_model_count_reflects_linked_stl_models(self):
        """Test that stl_model_count counts linked stl_models."""
        collection = CollectionFactory(name='Monster Pack')
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.collections.add(collection)

        data = CollectionListSerializer(collection).data
        assert data['stl_model_count'] == 1
