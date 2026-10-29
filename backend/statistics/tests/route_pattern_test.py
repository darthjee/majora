"""Tests for `statistics.route_pattern`."""

from unittest.mock import patch

from django.test import RequestFactory

from statistics.route_pattern import MAX_LENGTH, UNRESOLVED, route_pattern

FAKE_UUID = '00000000-0000-4000-8000-000000000000'


class TestRoutePattern:
    """Tests for `route_pattern`."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.factory = RequestFactory()

    def test_returns_route_pattern_for_parametrised_route(self):
        """Test that a parametrised URL stores its pattern, not its parameter values."""
        request = self.factory.get('/account/api_tokens/42.json')

        assert route_pattern(request) == 'account/api_tokens/<int:token_id>.json'

    def test_device_authorization_poll_stores_no_uuid(self):
        """Test that a device-authorization poll URL never stores the poll `uuid`."""
        request = self.factory.get(f'/users/authorization_requests/{FAKE_UUID}.json')

        result = route_pattern(request)

        assert result == 'users/authorization_requests/<uuid:uuid>.json'
        assert FAKE_UUID not in result

    def test_unmatched_path_returns_unresolved(self):
        """Test that a path matching no route stores the `unresolved` marker."""
        request = self.factory.get('/no/such/path/anywhere.php')

        assert route_pattern(request) == UNRESOLVED

    def test_query_string_is_never_included(self):
        """Test that the query string never reaches the stored value."""
        request = self.factory.get('/account/api_tokens/42.json?secret=fake-secret')

        assert '?' not in route_pattern(request)
        assert 'fake-secret' not in route_pattern(request)

    def test_long_route_is_truncated(self):
        """Test that a route longer than `MAX_LENGTH` is truncated."""
        request = self.factory.get('/account/api_tokens/42.json')
        long_route = 'a' * (MAX_LENGTH + 50)

        with patch('statistics.route_pattern.resolve') as resolve:
            resolve.return_value.route = long_route
            assert route_pattern(request) == 'a' * MAX_LENGTH
