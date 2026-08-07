"""Tests for the StlModelPhoto model."""

from django.test import TestCase

from miniatures.models import StlModelPhoto
from miniatures.tests.factories import StlModelFactory, StlModelPhotoFactory


class TestStlModelPhoto(TestCase):
    """Tests for the StlModelPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.stl_model = StlModelFactory(name='Dragon Miniature')

    def test_stl_model_photo_creation(self):
        """Test that a photo can be created and linked to an STL model."""
        photo = StlModelPhotoFactory(
            stl_model=self.stl_model, path='photos/miniatures/1/photo.png',
        )
        assert photo.path == 'photos/miniatures/1/photo.png'
        assert photo.stl_model == self.stl_model

    def test_stl_model_photo_str(self):
        """Test string representation of a photo."""
        photo = StlModelPhoto(path='photos/miniatures/1/photo.jpg', stl_model=self.stl_model)
        assert str(photo) == 'photos/miniatures/1/photo.jpg'

    def test_stl_model_photos_related_name(self):
        """Test that photos can be accessed via the STL model's related name."""
        StlModelPhotoFactory(stl_model=self.stl_model)
        StlModelPhotoFactory(stl_model=self.stl_model)
        assert self.stl_model.photos.count() == 2

    def test_deleting_stl_model_cascades_to_photos(self):
        """Test that deleting an STL model deletes its photos."""
        photo = StlModelPhotoFactory(stl_model=self.stl_model)
        self.stl_model.delete()
        assert not StlModelPhoto.objects.filter(id=photo.id).exists()
