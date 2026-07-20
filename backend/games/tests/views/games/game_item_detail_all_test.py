"""Tests for the game item detail/all.json view (DM/superuser only, includes hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameItemDetailAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/items/<item_id>/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and a hidden item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.hidden_item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)

    def _url(self, item_id=None, game_slug='test-game'):
        """Return the item detail/all URL for the given item (defaults to the fixture)."""
        item_id = item_id if item_id is not None else self.hidden_item.id
        return f'/games/{game_slug}/items/{item_id}/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_for_hidden_item(self, client):
        """Test that a DM gets 200 for a hidden item."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Hidden Gem'

    def test_superuser_gets_200_for_hidden_item(self, client):
        """Test that a superuser gets 200 for a hidden item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_includes_hidden_field(self, client):
        """Test that the response carries the hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_returns_404_for_unknown_item(self, client):
        """Test that 404 is returned for a non-existent item id."""
        response = self.get(client, self._url(item_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = self.get(client, self._url(game_slug='unknown-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-item-detail-all',
            kwargs={'game_slug': 'test-game', 'item_id': self.hidden_item.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
