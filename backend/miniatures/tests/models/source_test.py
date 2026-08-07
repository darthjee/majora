"""Tests for the Source model."""

import pytest
from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import Source
from miniatures.tests.factories import SourceFactory


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
