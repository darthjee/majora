"""Tests for the miniatures app's Django admin registration."""

from django.contrib import admin

from miniatures.models import (
    Collection,
    CollectionPhoto,
    Source,
    SourcePhoto,
    StlModel,
    StlModelLink,
    StlModelPhoto,
    Tag,
)


class TestMiniaturesAdmin:
    """Tests that every miniatures model is registered with the admin site."""

    def test_stl_model_registered(self):
        """Test that StlModel is registered."""
        assert StlModel in admin.site._registry

    def test_stl_model_link_registered(self):
        """Test that StlModelLink is registered."""
        assert StlModelLink in admin.site._registry

    def test_stl_model_photo_registered(self):
        """Test that StlModelPhoto is registered."""
        assert StlModelPhoto in admin.site._registry

    def test_source_registered(self):
        """Test that Source is registered."""
        assert Source in admin.site._registry

    def test_source_photo_registered(self):
        """Test that SourcePhoto is registered."""
        assert SourcePhoto in admin.site._registry

    def test_tag_registered(self):
        """Test that Tag is registered."""
        assert Tag in admin.site._registry

    def test_collection_registered(self):
        """Test that Collection is registered."""
        assert Collection in admin.site._registry

    def test_collection_photo_registered(self):
        """Test that CollectionPhoto is registered."""
        assert CollectionPhoto in admin.site._registry
