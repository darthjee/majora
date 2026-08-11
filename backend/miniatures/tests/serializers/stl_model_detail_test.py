"""Tests for the StlModelDetailSerializer."""

import pytest

from miniatures.models import StlModel
from miniatures.serializers import StlModelDetailSerializer
from miniatures.tests.factories import (
    CollectionFactory,
    SourceFactory,
    StlModelFactory,
    StlModelLinkFactory,
    StlModelPhotoFactory,
    TagFactory,
)


@pytest.mark.django_db
class TestStlModelDetailSerializer:
    """Tests for the StlModelDetailSerializer."""

    def test_returns_id_name_photo_url(self):
        """Test that id, name, and photo_url are returned."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        photo = StlModelPhotoFactory(stl_model=stl_model, path='photos/miniatures/1/photo.png')
        stl_model.photo = photo
        stl_model.save()

        data = StlModelDetailSerializer(stl_model).data
        assert data['id'] == stl_model.id
        assert data['name'] == 'Dragon Miniature'
        assert data['photo_url'] == 'photos/miniatures/1/photo.png'

    def test_returns_owned_type_race_role(self):
        """Test that owned, type, race, and role are returned."""
        stl_model = StlModelFactory(
            name='Dragon Miniature', owned=False, type=StlModel.TYPE_CREATURE,
            race=StlModel.RACE_DRAGONBORN, role=StlModel.ROLE_SORCERER,
        )

        data = StlModelDetailSerializer(stl_model).data
        assert data['owned'] is False
        assert data['type'] == StlModel.TYPE_CREATURE
        assert data['race'] == StlModel.RACE_DRAGONBORN
        assert data['role'] == StlModel.ROLE_SORCERER

    def test_race_and_role_serialize_as_none_when_unset(self):
        """Test that race and role serialize as null when unset."""
        stl_model = StlModelFactory(name='Dragon Miniature')

        data = StlModelDetailSerializer(stl_model).data
        assert data['race'] is None
        assert data['role'] is None

    def test_photo_url_is_none_without_a_photo(self):
        """Test that photo_url resolves to None when no photo is set."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        data = StlModelDetailSerializer(stl_model).data
        assert data['photo_url'] is None

    def test_returns_links(self):
        """Test that links are serialized with id/text/url/link_type."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        link = StlModelLinkFactory(
            stl_model=stl_model, text='Thingiverse', url='https://example.com/thing',
        )

        data = StlModelDetailSerializer(stl_model).data
        assert data['links'] == [
            {'id': link.id, 'text': 'Thingiverse', 'url': 'https://example.com/thing',
             'link_type': ''},
        ]

    def test_returns_sources_as_name_only_objects(self):
        """Test that sources are serialized as flat {name} objects."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.sources.add(SourceFactory(name='MyMiniFactory'))

        data = StlModelDetailSerializer(stl_model).data
        assert data['sources'] == [{'name': 'MyMiniFactory'}]

    def test_returns_collections_as_name_only_objects(self):
        """Test that collections are serialized as flat {name} objects."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.collections.add(CollectionFactory(name='Monster Pack'))

        data = StlModelDetailSerializer(stl_model).data
        assert data['collections'] == [{'name': 'Monster Pack'}]

    def test_returns_empty_collections_list_when_none_linked(self):
        """Test that collections serializes as an empty list when none are linked."""
        stl_model = StlModelFactory(name='Dragon Miniature')

        data = StlModelDetailSerializer(stl_model).data
        assert data['collections'] == []

    def test_returns_tags_as_flat_string_array(self):
        """Test that tags are serialized as a flat array of strings."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        stl_model.tags.add(TagFactory(name='dragon'), TagFactory(name='monster'))

        data = StlModelDetailSerializer(stl_model).data
        assert set(data['tags']) == {'dragon', 'monster'}
