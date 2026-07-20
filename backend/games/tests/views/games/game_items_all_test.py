"""Tests for the game items/all.json view (DM/superuser only, includes hidden)."""

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
class TestGameItemsAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/items/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and visible/hidden items."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.visible_item = GameItemFactory(game=self.game, name='Visible Gem')
        self.hidden_item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)

    def _url(self, game_slug='test-game'):
        """Return the items/all URL for the given game slug (defaults to the fixture)."""
        return f'/games/{game_slug}/items/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_with_both_visible_and_hidden_items(self, client):
        """Test that a DM gets 200 with both visible and hidden items."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_superuser_gets_200_with_both_visible_and_hidden_items(self, client):
        """Test that a superuser gets 200 with both visible and hidden items."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_hidden_field_per_item(self, client):
        """Test that each item carries its own hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        by_name = {item['name']: item['hidden'] for item in data}
        assert by_name['Visible Gem'] is False
        assert by_name['Hidden Gem'] is True

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the index-all endpoint."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert all('description' not in item for item in data)

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
        url = reverse('game-items-all', kwargs={'game_slug': 'test-game'})
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
