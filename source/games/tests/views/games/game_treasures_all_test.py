"""Tests for the game_treasures_all view (DM/superuser only, includes hidden treasures)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)

TREASURES_ALL_URL = '/games/test-game/treasures/all.json'


@pytest.mark.django_db
class TestGameTreasuresAllView(TokenAuthRequestMixin):
    """Tests for the game_treasures_all endpoint (DM/superuser only, includes hidden)."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.visible_treasure = TreasureFactory(
            name='Visible Gem', value=100, game=self.game, hidden=False
        )
        self.hidden_treasure = TreasureFactory(
            name='Hidden Gem', value=100, game=self.game, hidden=True
        )

    def _get(self, client, token=None):
        """Issue a GET request to the treasures/all endpoint, optionally with a token."""
        return self.get(client, TREASURES_ALL_URL, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_returns_200_for_dm_with_all_treasures(self, client):
        """Test that a DM gets 200 with both visible and hidden treasures."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_returns_200_for_superuser_with_all_treasures(self, client):
        """Test that a superuser gets 200 with both visible and hidden treasures."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, '/games/unknown-game/treasures/all.json', token=token)
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self, client):
        """Test that the response includes page/pages/per_page/total headers."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '2'

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_does_not_include_other_games_treasures(self, client):
        """Test that treasures exclusive/linked to a different game are excluded."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        TreasureFactory(name='Other Game Gem', value=100, game=other_game, hidden=True)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Other Game Gem' not in names
