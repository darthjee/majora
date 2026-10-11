"""Tests for the staff copies list dispatch view (GET /staff/copies/<type>.json)."""

import pytest

from games.models import GameItem
from games.tests.factories import GameFactory
from staff.tests.copy_test_support import FakeCopyTypeRegistryMixin, StaffCopyGateBehavior

URL = '/staff/copies/items.json'
QUERY = '?from=source&to=target'


@pytest.mark.django_db
class TestStaffCopiesListUnknownType(StaffCopyGateBehavior):
    """Tests for the list dispatch with the real, empty registry."""

    def setup_method(self):
        """Set up the actors and two games."""
        self.setup_actors()
        GameFactory(name='Source', game_slug='source')
        GameFactory(name='Target', game_slug='target')

    def send(self, client, token=None):
        """Issue a GET on the list of an unregistered type."""
        return self.get_json(client, URL + QUERY, token)

    def send_wrong_method(self, client, token=None):
        """Issue a POST on the list of an unregistered type."""
        return self.post_json(client, URL + QUERY, {}, token)

    def test_unknown_type_returns_404_with_skip_cache(self, client):
        """Test that an unregistered type returns 404 with X-Skip-Cache."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_unknown_type_returns_404_before_parameter_validation(self, client):
        """Test that an unregistered type returns 404 even without from/to."""
        assert self.get_json(client, URL, self.staff_token).status_code == 404


@pytest.mark.django_db
class TestStaffCopiesListDispatch(FakeCopyTypeRegistryMixin, StaffCopyGateBehavior):
    """Tests for the list dispatch with a registered fake type."""

    def setup_method(self):
        """Set up the actors, two games and a registered fake type."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.register_fake_copy_type('items', GameItem)

    def send(self, client, token=None, query=QUERY):
        """Issue a GET on the list with the given query string."""
        return self.get_json(client, URL + query, token)

    def send_wrong_method(self, client, token=None):
        """Issue a POST on the list."""
        return self.post_json(client, URL + QUERY, {}, token)

    def _assert_errors(self, client, query, errors):
        """Assert that `query` is rejected with 400 and the given error codes."""
        response = self.send(client, self.staff_token, query)
        assert response.status_code == 400
        assert response.json() == {'errors': errors}
        assert response['X-Skip-Cache'] == 'true'
        assert self.fake.list_calls == []

    def test_missing_from_and_to_return_400(self, client):
        """Test that missing from/to are rejected as required."""
        self._assert_errors(client, '', {'from': ['required'], 'to': ['required']})

    def test_empty_from_returns_400(self, client):
        """Test that an empty from is rejected as required."""
        self._assert_errors(client, '?from=&to=target', {'from': ['required']})

    def test_unknown_games_return_400(self, client):
        """Test that unknown from/to slugs are rejected as not found."""
        self._assert_errors(
            client, '?from=nope&to=nada', {'from': ['not_found'], 'to': ['not_found']},
        )

    def test_same_game_returns_400(self, client):
        """Test that from and to being the same game is rejected."""
        self._assert_errors(client, '?from=source&to=source', {'to': ['same_game']})

    def test_valid_request_hands_off_to_type(self, client):
        """Test that a valid request hands the resolved games to the type."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 200
        assert response.json() == {'from': 'source', 'to': 'target'}
        assert response['X-Skip-Cache'] == 'true'
        assert self.fake.list_calls == [(self.source, self.target)]

    def test_superuser_is_handed_off(self, client):
        """Test that a superuser passes the gate."""
        assert self.send(client, self.superuser_token).status_code == 200
