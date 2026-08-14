"""Tests for the StlModel model."""

import pytest
from django.core.exceptions import ValidationError
from django.test import TestCase

from miniatures.models import StlModel, StlModelRace, StlModelRole
from miniatures.tests.factories import (
    CollectionFactory,
    SourceFactory,
    StlModelFactory,
    StlModelPhotoFactory,
    TagFactory,
)


class TestStlModel(TestCase):
    """Tests for the StlModel model."""

    def test_stl_model_creation(self):
        """Test that an STL model can be created with a name."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        assert stl_model.name == 'Dragon Miniature'

    def test_stl_model_str(self):
        """Test string representation of an STL model."""
        stl_model = StlModel(name='Goblin Miniature')
        assert str(stl_model) == 'Goblin Miniature'

    def test_stl_model_ordering(self):
        """Test that STL models are ordered by id."""
        first = StlModelFactory(name='Zebra Mini')
        second = StlModelFactory(name='Alpha Mini')
        stl_models = list(StlModel.objects.all())
        assert stl_models[0].id == first.id
        assert stl_models[1].id == second.id

    def test_photo_defaults_to_none(self):
        """Test that an STL model has no photo by default."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        assert stl_model.photo is None

    def test_deleting_photo_clears_stl_model_photo(self):
        """Test that deleting an STL model's photo sets StlModel.photo back to None."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        photo = StlModelPhotoFactory(stl_model=stl_model)
        stl_model.photo = photo
        stl_model.save()

        photo.delete()

        stl_model.refresh_from_db()
        assert stl_model.photo is None

    def test_sources_can_be_attached(self):
        """Test that an STL model can be linked to multiple sources."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        source1 = SourceFactory(name='MyMiniFactory')
        source2 = SourceFactory(name='Printable Scenery')
        stl_model.sources.add(source1, source2)
        assert set(stl_model.sources.all()) == {source1, source2}

    def test_tags_can_be_attached(self):
        """Test that an STL model can be labeled with multiple tags."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        tag1 = TagFactory(name='dragon')
        tag2 = TagFactory(name='monster')
        stl_model.tags.add(tag1, tag2)
        assert set(stl_model.tags.all()) == {tag1, tag2}

    def test_collections_can_be_attached(self):
        """Test that an STL model can be linked to multiple collections."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        collection1 = CollectionFactory(name='Monster Pack')
        collection2 = CollectionFactory(name='Terrain Set')
        stl_model.collections.add(collection1, collection2)
        assert set(stl_model.collections.all()) == {collection1, collection2}

    def test_owned_defaults_to_true(self):
        """Test that owned defaults to True."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        assert stl_model.owned is True

    def test_url_defaults_to_none(self):
        """Test that url defaults to None."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        assert stl_model.url is None

    def test_size_defaults_to_none(self):
        """Test that size defaults to None."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        assert stl_model.size is None

    def test_type_is_required(self):
        """Test that a blank type fails full_clean() validation."""
        stl_model = StlModel(name='Dragon Miniature', type='')
        with pytest.raises(ValidationError):
            stl_model.full_clean()

    def test_invalid_type_raises_on_full_clean(self):
        """Test that an unknown type value fails full_clean() validation."""
        stl_model = StlModel(name='Dragon Miniature', type='not-a-type')
        with pytest.raises(ValidationError):
            stl_model.full_clean()

    def test_invalid_size_raises_on_full_clean(self):
        """Test that an unknown size value fails full_clean() validation."""
        stl_model = StlModel(name='Dragon Miniature', type=StlModel.TYPE_OTHER, size='not-a-size')
        with pytest.raises(ValidationError):
            stl_model.full_clean()

    def test_non_http_url_raises_on_full_clean(self):
        """Test that a non-http(s) url scheme fails full_clean() validation."""
        stl_model = StlModel(
            name='Dragon Miniature', type=StlModel.TYPE_OTHER, url='javascript:alert(1)',
        )
        with pytest.raises(ValidationError):
            stl_model.full_clean()

    def test_races_can_be_attached(self):
        """Test that an STL model can be tagged with multiple races."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRace.objects.create(stl_model=stl_model, creature=StlModel.RACE_ELF)
        StlModelRace.objects.create(stl_model=stl_model, creature=StlModel.RACE_DRAGON)
        assert set(stl_model.races.values_list('creature', flat=True)) == {
            StlModel.RACE_ELF, StlModel.RACE_DRAGON,
        }

    def test_roles_can_be_attached(self):
        """Test that an STL model can be tagged with multiple roles."""
        stl_model = StlModelFactory(name='Dragon Miniature')
        StlModelRole.objects.create(stl_model=stl_model, role=StlModel.ROLE_WIZARD)
        StlModelRole.objects.create(stl_model=stl_model, role=StlModel.ROLE_ARCHER)
        assert set(stl_model.roles.values_list('role', flat=True)) == {
            StlModel.ROLE_WIZARD, StlModel.ROLE_ARCHER,
        }
