"""Tests for the treasure permissions-check view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestTreasurePermissionsView(TokenAuthRequestMixin):
    """Tests for the GET /treasures/<id>/permissions.json endpoint."""

    def setup_method(self):
        """Set up a global treasure, a superuser, and a regular user."""
        self.treasure = TreasureFactory(name='Magic Staff', value=400)
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, token=None, query=''):
        """Issue a GET request to the treasure permissions endpoint."""
        url = f'/treasures/{self.treasure.id}/permissions.json'
        if query:
            url = f'{url}?{query}'
        return self.get(client, url, token=token)

    def test_non_existent_treasure_returns_200_with_can_edit_false(self, client):
        """Test that a non-existent treasure id returns 200 with can_edit False."""
        response = self.get(
            client, '/treasures/999999/permissions.json', token=self.superuser_token
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_superuser_can_edit_global_treasure(self, client):
        """Test that a superuser gets can_edit True for a global treasure."""
        response = self._get(client, token=self.superuser_token)
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_regular_user_cannot_edit_global_treasure(self, client):
        """Test that a regular user gets can_edit False for a global treasure."""
        response = self._get(client, token=self.regular_token)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_anonymous_cannot_edit(self, client):
        """Test that an unauthenticated request gets can_edit False."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_dm_of_owning_game_can_edit_game_exclusive_treasure(self, client):
        """Test that the DM of a treasure's owning game gets can_edit True."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        token = Token.objects.create(user=dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_dm_cannot_edit_global_treasure(self, client):
        """Test that a DM (of some game) cannot edit a global (gameless) treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        token = Token.objects.create(user=dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-permissions', kwargs={'treasure_id': self.treasure.id})
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header_without_role(self, client):
        """Test that the response sets X-Skip-Cache: true when no role param is given."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'
        assert 'X-Force-Public-Cache' not in response

    def test_role_superuser_can_edit_regardless_of_real_identity(self, client):
        """Test that ?role=superuser grants can_edit True even for an anonymous caller."""
        response = self._get(client, query='role=superuser')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_role_dm_is_a_no_op_for_global_treasure(self, client):
        """Test that ?role=dm never grants can_edit for a global (gameless) treasure."""
        response = self._get(client, query='role=dm')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_role_dm_can_edit_game_exclusive_treasure(self, client):
        """Test that ?role=dm grants can_edit True for a game-exclusive treasure."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        self.treasure.game = game
        self.treasure.save()
        response = self._get(client, query='role=dm')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self, client):
        """Test that an unrecognized role still switches to the role-simulated path."""
        response = self._get(client, token=self.superuser_token, query='role=bogus')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_omits_x_skip_cache_and_sets_force_public_cache_with_role(self, client):
        """Test that a role-simulated response sets X-Force-Public-Cache instead of X-Skip-Cache."""
        response = self._get(client, query='role=superuser')
        assert 'X-Skip-Cache' not in response
        assert response['X-Force-Public-Cache'] == 'true'
