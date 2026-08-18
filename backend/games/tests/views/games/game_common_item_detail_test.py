"""Tests for the game common item detail view (GET detail / PATCH update)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameCommonItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameCommonItemDetailView(TestCase):
    """Tests for the GET /games/<slug>/common_items/<common_item_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, common_item_id, game_slug='test-game'):
        """Return the common item detail URL for the given common item (defaults to fixture)."""
        return f'/games/{game_slug}/common_items/{common_item_id}.json'

    def test_returns_id_name_description_photo_path_price_category_fields(self):
        """Test that the detail response includes the documented fields."""
        common_item = GameCommonItemFactory(
            game=self.game, name='Healing Potion', description='A cheap tonic.', price=15,
            category=GameCommonItem.CATEGORY_POTION,
        )
        response = self.client.get(self._url(common_item.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == common_item.id
        assert data['name'] == 'Healing Potion'
        assert data['description'] == 'A cheap tonic.'
        assert data['photo_path'] is None
        assert data['price'] == 15
        assert data['category'] == GameCommonItem.CATEGORY_POTION

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        common_item = GameCommonItemFactory(game=self.game, name='Healing Potion')
        response = self.client.get(self._url(common_item.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_common_item(self):
        """Test that a hidden common item is not visible on the public route."""
        common_item = GameCommonItemFactory(game=self.game, name='Secret Poison', hidden=True)
        response = self.client.get(self._url(common_item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_common_item(self):
        """Test that 404 is returned for a non-existent common item id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_common_item_in_wrong_game(self):
        """Test that 404 is returned when the common item belongs to a different game."""
        common_item = GameCommonItemFactory(game=self.other_game, name='Silver Arrow')
        response = self.client.get(self._url(common_item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        common_item = GameCommonItemFactory(game=self.game, name='Healing Potion')
        response = self.client.get(self._url(common_item.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        common_item = GameCommonItemFactory(game=self.game, name='Healing Potion')
        url = reverse(
            'game-common-item-detail',
            kwargs={'game_slug': 'test-game', 'common_item_id': common_item.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameCommonItemDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/common_items/<common_item_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a player, an unrelated user, and a common item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.common_item = GameCommonItemFactory(
            game=self.game, name='Healing Potion', description='A cheap tonic.', price=15,
        )

    def _url(self, common_item_id=None, game_slug='test-game'):
        """Return the common item detail URL for the given common item (defaults to fixture)."""
        common_item_id = (
            common_item_id if common_item_id is not None else self.common_item.id
        )
        return f'/games/{game_slug}/common_items/{common_item_id}.json'

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
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Healing Potion'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the common item and returns 200."""
        response = self.patch(
            client,
            self._url(),
            {'name': 'Greater Healing Potion', 'price': 30, 'hidden': True},
            token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Greater Healing Potion'
        assert data['price'] == 30
        assert data['hidden'] is True
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Greater Healing Potion'
        assert self.common_item.price == 30
        assert self.common_item.hidden is True

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the common item and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'Super Potion'}, token=token)
        assert response.status_code == 200
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Super Potion'

    def test_patch_can_update_hidden_common_item(self, client):
        """Test that a DM can PATCH an already-hidden common item (excluded from public GET)."""
        self.common_item.hidden = True
        self.common_item.save()
        response = self.patch(
            client, self._url(), {'name': 'Still Hidden Poison'}, token=self.dm_token,
        )
        assert response.status_code == 200
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Still Hidden Poison'

    def test_patch_blank_name_returns_400(self, client):
        """Test that a blank name is rejected — GameCommonItem has no fallback."""
        response = self.patch(client, self._url(), {'name': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_negative_price_returns_400(self, client):
        """Test that a negative price is rejected with 400."""
        response = self.patch(client, self._url(), {'price': -5}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'price' in data['errors']
        self.common_item.refresh_from_db()
        assert self.common_item.price == 15

    def test_patch_invalid_category_returns_400(self, client):
        """Test that an unrecognized category is rejected with 400."""
        response = self.patch(
            client, self._url(), {'category': 'not-a-category'}, token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'category' in data['errors']

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body (only hidden) leaves other fields untouched."""
        response = self.patch(client, self._url(), {'hidden': True}, token=self.dm_token)
        assert response.status_code == 200
        self.common_item.refresh_from_db()
        assert self.common_item.hidden is True
        assert self.common_item.name == 'Healing Potion'
        assert self.common_item.description == 'A cheap tonic.'
        assert self.common_item.price == 15

    def test_patch_returns_404_for_unknown_common_item(self, client):
        """Test that PATCH on a non-existent common item id returns 404."""
        response = self.patch(
            client, self._url(common_item_id=99999), {'name': 'New Name'}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_staff_user_returns_200(self, client):
        """Test that an is_staff=True user unrelated to the game can PATCH the common item."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'Staff Potion'}, token=token)
        assert response.status_code == 200
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Staff Potion'

    def test_player_of_game_returns_200(self, client):
        """Test that a player of the game can PATCH the common item."""
        response = self.patch(
            client, self._url(), {'name': 'Player Potion'}, token=self.player_token,
        )
        assert response.status_code == 200
        self.common_item.refresh_from_db()
        assert self.common_item.name == 'Player Potion'
