"""Tests for the SourceDetailSerializer."""

import pytest

from miniatures.serializers import SourceDetailSerializer
from miniatures.tests.factories import SourceFactory, SourcePhotoFactory


@pytest.mark.django_db
class TestSourceDetailSerializer:
    """Tests for the SourceDetailSerializer."""

    def test_returns_id_name_url_photo_url(self):
        """Test that id, name, url, and photo_url are returned."""
        source = SourceFactory(name='MyMiniFactory', url='https://mymminifactory.com')
        photo = SourcePhotoFactory(source=source, path='photos/sources/1/photo.png')
        source.photo = photo
        source.save()

        data = SourceDetailSerializer(source).data
        assert data == {
            'id': source.id,
            'name': 'MyMiniFactory',
            'url': 'https://mymminifactory.com',
            'photo_url': 'photos/sources/1/photo.png',
        }

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        source = SourceFactory(name='MyMiniFactory')
        data = SourceDetailSerializer(source).data
        assert data['photo_url'] is None

    def test_url_defaults_to_blank_string(self):
        """Test that url is an empty string when not set."""
        source = SourceFactory(name='MyMiniFactory')
        data = SourceDetailSerializer(source).data
        assert data['url'] == ''
