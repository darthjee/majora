"""Tests for the game item detail view (GET detail / PATCH update)."""

import json

import pytest
from django.test import TestCase
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


class TestGameItemDetailView(TestCase):
    """Tests for the GET /games/<slug>/items/<item_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, item_id, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture game)."""
        return f'/games/{game_slug}/items/{item_id}.json'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that the detail response includes id, name, description, and photo_path."""
        item = GameItemFactory(game=self.game, name='Enchanted Bow', description='A fine bow.')
        response = self.client.get(self._url(item.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == item.id
        assert data['name'] == 'Enchanted Bow'
        assert data['description'] == 'A fine bow.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        item = GameItemFactory(game=self.game, name='Gem')
        response = self.client.get(self._url(item.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_item(self):
        """Test that a hidden item is not visible on the public route."""
        item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get(self._url(item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_item(self):
        """Test that 404 is returned for a non-existent item id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_item_in_wrong_game(self):
        """Test that 404 is returned when the item belongs to a different game."""
        item = GameItemFactory(game=self.other_game, name='Silver Dagger')
        response = self.client.get(self._url(item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        item = GameItemFactory(game=self.game, name='Gem')
        response = self.client.get(self._url(item.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        item = GameItemFactory(game=self.game, name='Gem')
        url = reverse(
            'game-item-detail', kwargs={'game_slug': 'test-game', 'item_id': item.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameItemDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and an item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.item = GameItemFactory(
            game=self.game, name='Enchanted Bow', description='A fine bow.',
        )

    def _url(self, item_id=None, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture item)."""
        item_id = item_id if item_id is not None else self.item.id
        return f'/games/{game_slug}/items/{item_id}.json'

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self.patch(client, self._url(), {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_non_dm_user_returns_403(self, client):
        """Test that PATCH from a non-dm/admin user is rejected with 403."""
        response = self.patch(
            client, self._url(), {'name': 'New Name'}, token=self.other_token,
        )
        assert response.status_code == 403
        self.item.refresh_from_db()
        assert self.item.name == 'Enchanted Bow'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the item and returns 200."""
        response = self.patch(
            client, self._url(), {'name': 'Silver Bow', 'hidden': True}, token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Silver Bow'
        assert data['hidden'] is True
        self.item.refresh_from_db()
        assert self.item.name == 'Silver Bow'
        assert self.item.hidden is True

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the item and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'Super Bow'}, token=token)
        assert response.status_code == 200
        self.item.refresh_from_db()
        assert self.item.name == 'Super Bow'

    def test_patch_can_update_hidden_item(self, client):
        """Test that a DM can PATCH an already-hidden item (excluded from the public GET)."""
        self.item.hidden = True
        self.item.save()
        response = self.patch(
            client, self._url(), {'name': 'Still Hidden Bow'}, token=self.dm_token,
        )
        assert response.status_code == 200
        self.item.refresh_from_db()
        assert self.item.name == 'Still Hidden Bow'

    def test_patch_blank_name_returns_400(self, client):
        """Test that a blank name is rejected with 400 — GameItem has no fallback target."""
        response = self.patch(client, self._url(), {'name': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body (only hidden) leaves name/description untouched."""
        response = self.patch(client, self._url(), {'hidden': True}, token=self.dm_token)
        assert response.status_code == 200
        self.item.refresh_from_db()
        assert self.item.hidden is True
        assert self.item.name == 'Enchanted Bow'
        assert self.item.description == 'A fine bow.'

    def test_patch_returns_404_for_unknown_item(self, client):
        """Test that PATCH on a non-existent item id returns 404."""
        response = self.patch(
            client, self._url(item_id=99999), {'name': 'New Name'}, token=self.dm_token,
        )
        assert response.status_code == 404
