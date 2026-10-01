"""Tests for the `X-Cache-Clear` header helpers."""

from rest_framework.response import Response

from staff.cache_clear_header import attach_cache_clear, attach_photo_cache_clear


class TestAttachCacheClear:
    """Tests for `attach_cache_clear`."""

    def test_joins_paths(self):
        """Test that the paths are joined with a comma and a space."""
        response = attach_cache_clear(Response(), ['/a.json', '/b/1.json'])
        assert response['X-Cache-Clear'] == '/a.json, /b/1.json'

    def test_empty_list_sets_no_header(self):
        """Test that an empty list leaves the response without the header."""
        response = attach_cache_clear(Response(), [])
        assert not response.has_header('X-Cache-Clear')


class TestAttachPhotoCacheClear:
    """Tests for `attach_photo_cache_clear`."""

    def test_unknown_photo_type_sets_no_header(self):
        """Test that a missing registry entry leaves the response without the header."""
        response = attach_photo_cache_clear(Response(), None, object())
        assert not response.has_header('X-Cache-Clear')
