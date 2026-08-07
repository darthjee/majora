"""Tests for the StlModelListSerializer."""

import pytest

from miniatures.serializers import StlModelListSerializer
from miniatures.tests.factories import StlModelFactory, StlModelPhotoFactory


@pytest.mark.django_db
class TestStlModelListSerializer:
    """Tests for the StlModelListSerializer."""

    def test_returns_id_name_photo_url(self):
        """Test that id, name, and photo_url are returned."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        photo = StlModelPhotoFactory(stl_model=stl_model, path='photos/miniatures/1/photo.png')
        stl_model.photo = photo
        stl_model.save()

        data = StlModelListSerializer(stl_model).data
        assert data == {
            'id': stl_model.id,
            'name': 'Dragon Miniature',
            'photo_url': 'photos/miniatures/1/photo.png',
        }

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        data = StlModelListSerializer(stl_model).data
        assert data['photo_url'] is None
