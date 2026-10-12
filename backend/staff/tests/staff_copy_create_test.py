"""Tests for the staff copy dispatch view (POST /staff/copies/<type>/<id>.json)."""

import pytest

from games.models import GameItem
from games.tests.factories import GameFactory, GameItemFactory
from staff.tests.copy_test_support import FakeCopyTypeRegistryMixin, StaffCopyGateBehavior


def _url(source_id):
    """Return the copy URL of the `items` entity `source_id`."""
    return f'/staff/copies/items/{source_id}.json'


def _unknown_url(source_id):
    """Return the copy URL of the entity `source_id` of an unregistered type."""
    return f'/staff/copies/unknown/{source_id}.json'


@pytest.mark.django_db
class TestStaffCopyCreateUnknownType(StaffCopyGateBehavior):
    """Tests for the copy dispatch with the real registry and an unregistered type."""

    def setup_method(self):
        """Set up the actors, two games and a source item."""
        self.setup_actors()
        GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(game=GameFactory(name='Source', game_slug='source'))

    def send(self, client, token=None):
        """Issue a POST on the copy of an unregistered type."""
        return self.post_json(client, _unknown_url(self.item.id), {'target': 'target'}, token)

    def send_wrong_method(self, client, token=None):
        """Issue a GET on the copy URL."""
        return self.get_json(client, _unknown_url(self.item.id), token)

    def test_unknown_type_returns_404_with_skip_cache(self, client):
        """Test that an unregistered type returns 404 with X-Skip-Cache."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_unknown_type_returns_404_before_body_validation(self, client):
        """Test that an unregistered type returns 404 even with an invalid body."""
        response = self.post_json(client, _unknown_url(self.item.id), {}, self.staff_token)
        assert response.status_code == 404


@pytest.mark.django_db
class TestStaffCopyCreateDispatch(FakeCopyTypeRegistryMixin, StaffCopyGateBehavior):
    """Tests for the copy dispatch with a registered fake type."""

    def setup_method(self):
        """Set up the actors, two games, a source item and a registered fake type."""
        self.setup_actors()
        self.source_game = GameFactory(name='Source', game_slug='source')
        self.target_game = GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(game=self.source_game)
        self.missing_id = self.item.id + 1000
        self.register_fake_copy_type('items', GameItem)

    def send(self, client, token=None, payload=None, source_id=None):
        """Issue a POST on the copy URL (defaults: the source item, a valid target)."""
        payload = {'target': 'target'} if payload is None else payload
        return self.post_json(client, _url(source_id or self.item.id), payload, token)

    def send_wrong_method(self, client, token=None):
        """Issue a GET on the copy URL."""
        return self.get_json(client, _url(self.item.id), token)

    def _assert_target_error(self, response, code):
        """Assert a 400 rejecting `target` with `code`, and no hand-off."""
        assert response.status_code == 400
        assert response.json() == {'errors': {'target': [code]}}
        assert response['X-Skip-Cache'] == 'true'
        assert self.fake.copy_calls == []

    @pytest.mark.parametrize('payload, code', [
        ({}, 'required'),
        ({'target': ''}, 'required'),
        ({'target': None}, 'required'),
        ({'target': 42}, 'invalid'),
        ({'target': ['target']}, 'invalid'),
        ({'target': 'nope'}, 'not_found'),
        (['target'], 'required'),
    ])
    def test_invalid_target_returns_400(self, client, payload, code):
        """Test that an invalid target is rejected with 400."""
        response = self.send(client, self.staff_token, payload)
        self._assert_target_error(response, code)

    @pytest.mark.parametrize('payload', [{}, {'target': 42}, {'target': 'nope'}])
    def test_invalid_target_returns_400_for_missing_source(self, client, payload):
        """Test that request validation runs before the source lookup."""
        response = self.send(client, self.staff_token, payload, source_id=self.missing_id)
        assert response.status_code == 400

    def test_malformed_json_returns_400(self, client):
        """Test that a malformed JSON body returns 400 with X-Skip-Cache."""
        response = self.post_raw(client, _url(self.missing_id), '{not json', self.staff_token)
        assert response.status_code == 400
        assert response['X-Skip-Cache'] == 'true'
        assert self.fake.copy_calls == []

    def test_unknown_source_returns_404(self, client):
        """Test that an unknown source id with a valid target returns 404."""
        response = self.send(client, self.staff_token, source_id=self.missing_id)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_target_equal_to_source_game_returns_400(self, client):
        """Test that copying into the source's own game is rejected."""
        response = self.send(client, self.staff_token, {'target': 'source'})
        self._assert_target_error(response, 'same_game')

    def test_valid_request_hands_off_to_type(self, client):
        """Test that a valid request hands the source and target game to the type."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 201
        assert response.json() == {'source': self.item.id, 'target': 'target'}
        assert response['X-Skip-Cache'] == 'true'
        assert self.fake.copy_calls == [(self.item, self.target_game)]

    def test_superuser_is_handed_off(self, client):
        """Test that a superuser passes the gate."""
        assert self.send(client, self.superuser_token).status_code == 201
