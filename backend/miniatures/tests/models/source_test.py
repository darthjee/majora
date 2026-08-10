"""Tests for the Source model."""

import pytest
from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import Source
from miniatures.tests.factories import SourceFactory, SourcePhotoFactory


class TestSource(TestCase):
    """Tests for the Source model."""

    def test_source_creation(self):
        """Test that a source can be created with a name."""
        source = SourceFactory(name='MyMiniFactory')
        assert source.name == 'MyMiniFactory'

    def test_source_str(self):
        """Test string representation of a source."""
        source = Source(name='Printable Scenery')
        assert str(source) == 'Printable Scenery'

    def test_name_uniqueness_enforced(self):
        """Test that two sources cannot share the same name."""
        SourceFactory(name='MyMiniFactory')
        with pytest.raises(IntegrityError):
            SourceFactory(name='MyMiniFactory')

    def test_url_defaults_to_blank(self):
        """Test that a source has a blank url by default."""
        source = SourceFactory(name='MyMiniFactory')
        assert source.url == ''

    def test_url_can_be_set(self):
        """Test that a source's url can be set."""
        source = SourceFactory(name='MyMiniFactory', url='https://mymminifactory.com')
        assert source.url == 'https://mymminifactory.com'

    def test_photo_defaults_to_none(self):
        """Test that a source has no photo by default."""
        source = SourceFactory(name='MyMiniFactory')
        assert source.photo is None

    def test_deleting_photo_clears_source_photo(self):
        """Test that deleting a source's photo sets Source.photo back to None."""
        source = SourceFactory(name='MyMiniFactory')
        photo = SourcePhotoFactory(source=source)
        source.photo = photo
        source.save()

        photo.delete()

        source.refresh_from_db()
        assert source.photo is None
