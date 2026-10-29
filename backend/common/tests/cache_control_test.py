"""Tests for the common.cache_control module."""

from django.http import HttpResponse

from common.cache_control import forbid_storing


def _response(cache_control=None):
    """Return an empty response with an optional `Cache-Control` value."""
    response = HttpResponse()
    if cache_control is not None:
        response['Cache-Control'] = cache_control
    return response


class TestForbidStoring:
    """Tests for forbid_storing()."""

    def test_sets_no_store_when_missing(self):
        """Test that a response without Cache-Control gets no-store."""
        assert forbid_storing(_response())['Cache-Control'] == 'no-store'

    def test_replaces_a_storable_value(self):
        """Test that a value allowing storage is replaced by no-store."""
        response = forbid_storing(_response('private, max-age=30'))
        assert response['Cache-Control'] == 'no-store'

    def test_keeps_private_no_store(self):
        """Test that a view's `private, no-store` is kept as is."""
        response = forbid_storing(_response('private, no-store'))
        assert response['Cache-Control'] == 'private, no-store'

    def test_directive_match_is_case_insensitive(self):
        """Test that an upper-case NO-STORE directive is kept."""
        response = forbid_storing(_response('private,NO-STORE'))
        assert response['Cache-Control'] == 'private,NO-STORE'

    def test_no_store_prefix_is_not_enough(self):
        """Test that a directive merely starting with no-store does not count."""
        response = forbid_storing(_response('no-stored'))
        assert response['Cache-Control'] == 'no-store'
