"""Tests for the game access-check view."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster


@pytest.mark.django_db
class TestGameAccessView:

    """Tests for the game access endpoint."""

    def setup_method(self):
        """Set up a game and a DM user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)

    def _get(self, client, token=None):
        """Issue a GET request to the game access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/games/epic-quest/access.json', **extra)

    def test_non_existent_slug_returns_200_with_can_edit_false(self, client):
        """Test that a non-existent game slug returns 200 with can_edit false."""
        response = client.get('/games/no-such-game/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_unauthenticated_returns_200_with_can_edit_false(self, client):
        """Test that an unauthenticated request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_returns_200_with_can_edit_true(self, client):
        """Test that the game DM returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_returns_200_with_can_edit_false(self, client):
        """Test that a non-DM authenticated user returns 200 with can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_superuser_returns_200_with_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_unauthenticated_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM request returns correct username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser request returns correct username, is_superuser=True, is_dm=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test non-DM user returns correct username, is_superuser=False, is_dm=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False

    def test_dm_via_session_returns_can_edit_true(self, client):
        """Test that the game DM authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get('/games/epic-quest/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_via_session_returns_can_edit_false(self, client):
        """Test that a non-DM user authenticated via session cookie returns can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get('/games/epic-quest/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False
