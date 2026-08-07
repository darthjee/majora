"""Tests for the StlModelLink model."""

from django.test import TestCase

from miniatures.models import StlModelLink
from miniatures.tests.factories import StlModelFactory, StlModelLinkFactory


class TestStlModelLink(TestCase):
    """Tests for the StlModelLink model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.stl_model = StlModelFactory(name='Dragon Miniature')

    def test_stl_model_link_creation(self):
        """Test that a link can be created and linked to an STL model."""
        link = StlModelLinkFactory(
            stl_model=self.stl_model, text='Thingiverse', url='https://example.com/thing',
        )
        assert link.text == 'Thingiverse'
        assert link.url == 'https://example.com/thing'
        assert link.stl_model == self.stl_model

    def test_stl_model_links_related_name(self):
        """Test that links can be accessed via the STL model's related name."""
        StlModelLinkFactory(stl_model=self.stl_model)
        StlModelLinkFactory(stl_model=self.stl_model)
        assert self.stl_model.links.count() == 2

    def test_deleting_stl_model_cascades_to_links(self):
        """Test that deleting an STL model deletes its links."""
        link = StlModelLinkFactory(stl_model=self.stl_model)
        self.stl_model.delete()
        assert not StlModelLink.objects.filter(id=link.id).exists()
