"""Tests for the CollectionPhoto model."""

from django.test import TestCase

from miniatures.models import CollectionPhoto
from miniatures.tests.factories import CollectionFactory, CollectionPhotoFactory


class TestCollectionPhoto(TestCase):
    """Tests for the CollectionPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.collection = CollectionFactory(name='Monster Pack')

    def test_collection_photo_creation(self):
        """Test that a photo can be created and linked to a collection."""
        photo = CollectionPhotoFactory(
            collection=self.collection, path='photos/collections/1/photo.png',
        )
        assert photo.path == 'photos/collections/1/photo.png'
        assert photo.collection == self.collection

    def test_collection_photo_str(self):
        """Test string representation of a photo."""
        photo = CollectionPhoto(path='photos/collections/1/photo.jpg', collection=self.collection)
        assert str(photo) == 'photos/collections/1/photo.jpg'

    def test_collection_photos_related_name(self):
        """Test that photos can be accessed via the collection's related name."""
        CollectionPhotoFactory(collection=self.collection)
        CollectionPhotoFactory(collection=self.collection)
        assert self.collection.photos.count() == 2

    def test_deleting_collection_cascades_to_photos(self):
        """Test that deleting a collection deletes its photos."""
        photo = CollectionPhotoFactory(collection=self.collection)
        self.collection.delete()
        assert not CollectionPhoto.objects.filter(id=photo.id).exists()
