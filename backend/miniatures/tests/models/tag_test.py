"""Tests for the Tag model."""

import pytest
from django.db import IntegrityError
from django.test import TestCase

from miniatures.models import Tag
from miniatures.tests.factories import TagFactory


class TestTag(TestCase):
    """Tests for the Tag model."""

    def test_tag_creation(self):
        """Test that a tag can be created with a name."""
        tag = TagFactory(name='dragon')
        assert tag.name == 'dragon'

    def test_tag_str(self):
        """Test string representation of a tag."""
        tag = Tag(name='goblin')
        assert str(tag) == 'goblin'

    def test_name_uniqueness_enforced(self):
        """Test that two tags cannot share the same name."""
        TagFactory(name='dragon')
        with pytest.raises(IntegrityError):
            TagFactory(name='dragon')
