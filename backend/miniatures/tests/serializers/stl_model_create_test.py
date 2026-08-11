"""Tests for the StlModelCreateSerializer."""

import pytest

from miniatures.models import Tag
from miniatures.serializers import StlModelCreateSerializer
from miniatures.serializers._tags_sync import MAX_TAGS
from miniatures.tests.factories import CollectionFactory, SourceFactory, TagFactory


@pytest.mark.django_db
class TestStlModelCreateSerializer:
    """Tests for the StlModelCreateSerializer."""

    def test_valid_with_name_only(self):
        """Test that a payload with only a name is valid."""
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature'})
        assert serializer.is_valid()

    def test_valid_with_name_and_tags(self):
        """Test that a payload with a name and tags is valid."""
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'tags': ['dragon', 'monster']}
        )
        assert serializer.is_valid()

    def test_missing_name_returns_error(self):
        """Test that a missing name is invalid."""
        serializer = StlModelCreateSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_tags_count_over_max_returns_error(self):
        """Test that more than MAX_TAGS entries is rejected."""
        tags = [f'tag-{i}' for i in range(MAX_TAGS + 1)]
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature', 'tags': tags})
        assert not serializer.is_valid()
        assert 'tags' in serializer.errors

    def test_tags_count_at_max_is_valid(self):
        """Test that exactly MAX_TAGS entries is accepted."""
        tags = [f'tag-{i}' for i in range(MAX_TAGS)]
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature', 'tags': tags})
        assert serializer.is_valid()

    def test_over_length_tag_returns_error(self):
        """Test that a tag longer than 200 characters is rejected with a 400."""
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'tags': ['x' * 201]}
        )
        assert not serializer.is_valid()
        assert 'tags' in serializer.errors

    def test_create_persists_name(self):
        """Test that create() persists the given name."""
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature'})
        serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.name == 'Dragon Miniature'

    def test_create_attaches_new_tags_lowercased(self):
        """Test that create() get-or-creates and attaches lowercased tags."""
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'tags': ['Dragon', 'Monster']}
        )
        serializer.is_valid()
        stl_model = serializer.save()
        assert set(stl_model.tags.values_list('name', flat=True)) == {'dragon', 'monster'}

    def test_create_reuses_existing_tag_case_insensitively(self):
        """Test that create() reuses an existing Tag rather than creating a duplicate."""
        existing = TagFactory(name='dragon')
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'tags': ['Dragon']}
        )
        serializer.is_valid()
        stl_model = serializer.save()
        assert list(stl_model.tags.all()) == [existing]
        assert Tag.objects.filter(name='dragon').count() == 1

    def test_create_with_no_tags_attaches_none(self):
        """Test that create() with no tags leaves the STL model without any tags."""
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature'})
        serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.tags.count() == 0

    def test_create_with_source_ids_links_given_sources(self):
        """Test that create() links the STL model to the given sources."""
        source = SourceFactory(name='MyMiniFactory')
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'source_ids': [source.id]}
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert list(stl_model.sources.all()) == [source]

    def test_create_with_no_source_ids_leaves_sources_empty(self):
        """Test that create() with no source_ids leaves the sources M2M empty."""
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature'})
        serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.sources.count() == 0

    def test_unknown_source_id_returns_error(self):
        """Test that an unknown source_ids entry is rejected with a 400-worthy error."""
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'source_ids': [999999]}
        )
        assert not serializer.is_valid()
        assert 'source_ids' in serializer.errors

    def test_create_with_collection_ids_links_given_collections(self):
        """Test that create() links the STL model to the given collections."""
        collection = CollectionFactory(name='Monster Pack')
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'collection_ids': [collection.id]}
        )
        assert serializer.is_valid()
        stl_model = serializer.save()
        assert list(stl_model.collections.all()) == [collection]

    def test_create_with_no_collection_ids_leaves_collections_empty(self):
        """Test that create() with no collection_ids leaves the collections M2M empty."""
        serializer = StlModelCreateSerializer(data={'name': 'Dragon Miniature'})
        serializer.is_valid()
        stl_model = serializer.save()
        assert stl_model.collections.count() == 0

    def test_unknown_collection_id_returns_error(self):
        """Test that an unknown collection_ids entry is rejected with a 400-worthy error."""
        serializer = StlModelCreateSerializer(
            data={'name': 'Dragon Miniature', 'collection_ids': [999999]}
        )
        assert not serializer.is_valid()
        assert 'collection_ids' in serializer.errors
