"""Tests for the game common item detail/full.json view (DM/superuser only, includes hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameCommonItemDetailFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/common_items/<common_item_id>/full.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and a hidden common item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.hidden_common_item = GameCommonItemFactory(
            game=self.game, name='Secret Poison', hidden=True, description='A rare poison.',
        )

    def _url(self, common_item_id=None, game_slug='test-game'):
        """Return the common item detail/full URL for the given common item (default fixture)."""
        common_item_id = (
            common_item_id if common_item_id is not None else self.hidden_common_item.id
        )
        return f'/games/{game_slug}/common_items/{common_item_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_for_hidden_common_item(self, client):
        """Test that a DM gets 200 for a hidden common item."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Secret Poison'

    def test_superuser_gets_200_for_hidden_common_item(self, client):
        """Test that a superuser gets 200 for a hidden common item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_includes_hidden_field(self, client):
        """Test that the response carries the hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_response_includes_description_field(self, client):
        """Test that the response carries the description field."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['description'] == 'A rare poison.'

    def test_returns_404_for_unknown_common_item(self, client):
        """Test that 404 is returned for a non-existent common item id."""
        response = self.get(client, self._url(common_item_id=99999), token=self.dm_token)
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
            'game-common-item-detail-full',
            kwargs={'game_slug': 'test-game', 'common_item_id': self.hidden_common_item.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
