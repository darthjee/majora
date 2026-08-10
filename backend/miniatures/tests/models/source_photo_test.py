"""Tests for the SourcePhoto model."""

from django.test import TestCase

from miniatures.models import SourcePhoto
from miniatures.tests.factories import SourceFactory, SourcePhotoFactory


class TestSourcePhoto(TestCase):
    """Tests for the SourcePhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.source = SourceFactory(name='MyMiniFactory')

    def test_source_photo_creation(self):
        """Test that a photo can be created and linked to a source."""
        photo = SourcePhotoFactory(source=self.source, path='photos/sources/1/photo.png')
        assert photo.path == 'photos/sources/1/photo.png'
        assert photo.source == self.source

    def test_source_photo_str(self):
        """Test string representation of a photo."""
        photo = SourcePhoto(path='photos/sources/1/photo.jpg', source=self.source)
        assert str(photo) == 'photos/sources/1/photo.jpg'

    def test_source_photos_related_name(self):
        """Test that photos can be accessed via the source's related name."""
        SourcePhotoFactory(source=self.source)
        SourcePhotoFactory(source=self.source)
        assert self.source.photos.count() == 2

    def test_deleting_source_cascades_to_photos(self):
        """Test that deleting a source deletes its photos."""
        photo = SourcePhotoFactory(source=self.source)
        self.source.delete()
        assert not SourcePhoto.objects.filter(id=photo.id).exists()
