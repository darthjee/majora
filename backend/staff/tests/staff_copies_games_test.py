"""Tests for the staff copies games view (GET /staff/copies/games.json)."""

import pytest
from django.test import override_settings

from domains.tests.factories import DomainFactory, DomainGroupFactory
from games.tests.factories import GameFactory
from staff.tests.copy_test_support import StaffCopyGateBehavior

URL = '/staff/copies/games.json'


@pytest.mark.django_db
class TestStaffCopiesGamesView(StaffCopyGateBehavior):
    """Tests for the GET /staff/copies/games.json endpoint."""

    def setup_method(self):
        """Set up the actors, two domain groups and games across them."""
        self.setup_actors()
        self.tenant = DomainFactory(domain='tenant.example.com').domain_group
        self.other_group = DomainGroupFactory(name='Other Group')
        self.tenant.name = 'Tenant Group'
        self.tenant.save()
        GameFactory(name='Zeta', game_slug='zeta', game_domain_groups=[self.other_group])
        GameFactory(name='Alpha', game_slug='alpha')
        GameFactory(
            name='Mid', game_slug='mid', game_domain_groups=[self.tenant, self.other_group],
        )

    def send(self, client, token=None):
        """Issue a GET on the games list."""
        return self.get_json(client, URL, token)

    def send_wrong_method(self, client, token=None):
        """Issue a POST on the games list."""
        return self.post_json(client, URL, {}, token)

    def _games(self, client, token=None):
        """Return the decoded games list as staff (or the given token)."""
        response = self.send(client, token or self.staff_token)
        assert response.status_code == 200
        return response.json()

    def _game(self, client, slug):
        """Return the listed entry for `slug`."""
        return next(game for game in self._games(client) if game['slug'] == slug)

    def test_staff_gets_200_with_skip_cache(self, client):
        """Test that a staff user gets 200 with X-Skip-Cache."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'

    def test_superuser_returns_200(self, client):
        """Test that a superuser can read the games list."""
        assert self.send(client, self.superuser_token).status_code == 200

    def test_games_are_ordered_by_name(self, client):
        """Test that games are listed ordered by name."""
        assert [game['slug'] for game in self._games(client)] == ['alpha', 'mid', 'zeta']

    def test_game_without_group_lists_empty_groups(self, client):
        """Test that a game without a domain group gets an empty list."""
        assert self._game(client, 'alpha') == {
            'slug': 'alpha', 'name': 'Alpha', 'domain_groups': [],
        }

    def test_game_in_two_groups_lists_both(self, client):
        """Test that a game in several domain groups lists every group name, by name."""
        assert self._game(client, 'mid')['domain_groups'] == ['Other Group', 'Tenant Group']

    @override_settings(ALLOWED_HOSTS=['*'])
    def test_lists_games_outside_request_domain(self, client):
        """Test that games outside the request's domain group are still listed."""
        response = client.get(URL, HTTP_HOST='tenant.example.com', **self.auth(self.staff_token))
        assert [game['slug'] for game in response.json()] == ['alpha', 'mid', 'zeta']
