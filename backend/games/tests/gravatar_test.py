"""Tests for the GravatarUrlBuilder class."""

from django.test import TestCase

from games.gravatar import GravatarUrlBuilder
from games.settings import Settings


class TestGravatarUrlBuilder(TestCase):
    """Tests for GravatarUrlBuilder.build()."""

    def test_builds_url_from_email_hash(self):
        """Test that a URL is built from the Gravatar base URL and the given hash."""
        result = GravatarUrlBuilder.build('deadbeef')
        assert result == f'{Settings.gravatar_base_url()}deadbeef'

    def test_returns_none_for_empty_hash(self):
        """Test that None is returned when email_hash is an empty string."""
        assert GravatarUrlBuilder.build('') is None

    def test_returns_none_for_none_hash(self):
        """Test that None is returned when email_hash is None."""
        assert GravatarUrlBuilder.build(None) is None
