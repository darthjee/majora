"""Tests for the treasure detail view (GET detail / PATCH update)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, Treasure


@pytest.mark.django_db
class TestTreasureDetailView:
    """Tests for the GET /treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up a treasure for testing."""
        self.treasure = Treasure.objects.create(name='Enchanted Bow', value=750)

    def test_returns_treasure_detail(self, client):
        """Test that treasure detail is returned for a valid id."""
        response = client.get(f'/treasures/{self.treasure.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == self.treasure.id
        assert data['name'] == 'Enchanted Bow'
        assert data['value'] == 750

    def test_returns_404_for_unknown_id(self, client):
        """Test that 404 is returned for a non-existent treasure id."""
        response = client.get('/treasures/999999.json')
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-detail', kwargs={'treasure_id': self.treasure.id})
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestTreasureDetailPatchView:
    """Tests for the PATCH /treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up a treasure, a superuser, and a regular user."""
        self.treasure = Treasure.objects.create(name='Old Helmet', value=80)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the treasure detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/treasures/{self.treasure.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update a treasure and receives 200."""
        response = self._patch(client, {'name': 'New Helmet'}, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'New Helmet'

    def test_patch_persists_changes(self, client):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(client, {'name': 'Updated Helmet', 'value': 90}, token=self.superuser_token)
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Updated Helmet'
        assert self.treasure.value == 90

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token returns 401."""
        response = self._patch(client, {'name': 'Hacked Helmet'})
        assert response.status_code == 401

    def test_patch_with_non_superuser_returns_403(self, client):
        """Test that PATCH from a non-superuser returns 403."""
        response = self._patch(client, {'name': 'Hacked Helmet'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_treasure_returns_404(self, client):
        """Test that PATCH on a non-existent treasure returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.superuser_token.key}'}
        response = client.patch(
            '/treasures/999999.json',
            data=json.dumps({'name': 'Ghost'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(client, {'name': 'Partial Update'}, token=self.superuser_token)
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Partial Update'
        assert self.treasure.value == 80

    def test_patch_with_dm_of_owning_game_returns_403(self, client):
        """Test that PATCH is still rejected with 403 for the DM of the treasure's game."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.treasure.game = game
        self.treasure.save()
        dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=game, user=dm_user)
        dm_token = Token.objects.create(user=dm_user)
        response = self._patch(client, {'name': 'Hacked Helmet'}, token=dm_token)
        assert response.status_code == 403
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Old Helmet'
