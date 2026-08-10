"""Tests for the SourceCreateSerializer."""

import pytest

from miniatures.serializers import SourceCreateSerializer
from miniatures.tests.factories import SourceFactory


@pytest.mark.django_db
class TestSourceCreateSerializer:
    """Tests for the SourceCreateSerializer."""

    def test_valid_with_name_only(self):
        """Test that a payload with only a name is valid."""
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        assert serializer.is_valid()

    def test_valid_with_name_and_url(self):
        """Test that a payload with a name and url is valid."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'https://mymminifactory.com'}
        )
        assert serializer.is_valid()

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = SourceCreateSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_duplicate_name_returns_error(self):
        """Test that a duplicate name is rejected via DRF's automatic UniqueValidator."""
        SourceFactory(name='MyMiniFactory')
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_create_persists_name_and_url(self):
        """Test that create() persists the given name and url."""
        serializer = SourceCreateSerializer(
            data={'name': 'MyMiniFactory', 'url': 'https://mymminifactory.com'}
        )
        serializer.is_valid()
        source = serializer.save()
        assert source.name == 'MyMiniFactory'
        assert source.url == 'https://mymminifactory.com'

    def test_create_with_no_url_defaults_to_blank(self):
        """Test that create() with no url leaves the source's url blank."""
        serializer = SourceCreateSerializer(data={'name': 'MyMiniFactory'})
        serializer.is_valid()
        source = serializer.save()
        assert source.url == ''
