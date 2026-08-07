"""Tests for the StlModel model."""

from django.test import TestCase

from miniatures.models import StlModel
from miniatures.tests.factories import (
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
