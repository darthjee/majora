"""Tests for the SourceListSerializer."""

import pytest

from miniatures.serializers import SourceListSerializer
from miniatures.tests.factories import SourceFactory, SourcePhotoFactory


@pytest.mark.django_db
class TestSourceListSerializer:
    """Tests for the SourceListSerializer."""

    def test_returns_id_name_photo_url(self):
        """Test that id, name, and photo_url are returned."""
        source = SourceFactory(name='MyMiniFactory')
        photo = SourcePhotoFactory(source=source, path='photos/sources/1/photo.png')
        source.photo = photo
        source.save()

        data = SourceListSerializer(source).data
        assert data == {
            'id': source.id,
            'name': 'MyMiniFactory',
            'photo_url': 'photos/sources/1/photo.png',
        }

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        source = SourceFactory(name='MyMiniFactory')
        data = SourceListSerializer(source).data
        assert data['photo_url'] is None
