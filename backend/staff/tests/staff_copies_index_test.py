"""Tests for the staff copies index view (GET /staff/copies.json)."""

import pytest

from games.models import GameItem
from staff.tests.copy_test_support import (
    FakeCopyType,
    StaffCopyGateBehavior,
    register_copy_types,
)

URL = '/staff/copies.json'


@pytest.mark.django_db
class TestStaffCopiesIndexView(StaffCopyGateBehavior):
    """Tests for the GET /staff/copies.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def send(self, client, token=None):
        """Issue a GET on the index."""
        return self.get_json(client, URL, token)

    def send_wrong_method(self, client, token=None):
        """Issue a POST on the index."""
        return self.post_json(client, URL, {}, token)

    def test_staff_gets_registered_types_items_first(self, client):
        """Test that a staff user gets the registered types, `items` then `common_items`."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 200
        assert response.json()['types'][:2] == ['items', 'common_items']
        assert response['X-Skip-Cache'] == 'true'

    def test_superuser_returns_200(self, client):
        """Test that a superuser can read the index."""
        assert self.send(client, self.superuser_token).status_code == 200

    def test_lists_registered_types(self, client, monkeypatch):
        """Test that registered copy types are listed in registry order."""
        register_copy_types(monkeypatch, FakeCopyType('items', GameItem))
        assert self.send(client, self.staff_token).json() == {'types': ['items']}
