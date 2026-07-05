"""Tests for the game session detail view (GET detail / PATCH update)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, GameSession


@pytest.mark.django_db
class TestGameSessionDetailView:
    """Tests for the GET /games/<slug>/sessions/<id>.json endpoint."""

    def setup_method(self):
        """Set up a game and a session for testing."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        self.session = GameSession.objects.create(game=self.game, title='Session One')

    def test_returns_session_detail(self, client):
        """Test that session detail is returned for a valid id."""
        response = client.get(f'/games/test-game/sessions/{self.session.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == self.session.id
        assert data['title'] == 'Session One'
        assert data['game_slug'] == 'test-game'
        assert data['can_edit'] is False

    def test_returns_404_for_unknown_session_id(self, client):
        """Test that 404 is returned for a non-existent session id."""
        response = client.get('/games/test-game/sessions/999999.json')
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get(f'/games/unknown-game/sessions/{self.session.id}.json')
        assert response.status_code == 404

    def test_returns_404_when_session_belongs_to_different_game(self, client):
        """Test that 404 is returned when session_id does not belong to game_slug."""
        response = client.get(f'/games/other-game/sessions/{self.session.id}.json')
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-session-detail',
            kwargs={'game_slug': 'test-game', 'session_id': self.session.id},
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameSessionDetailPatchView:
    """Tests for the PATCH /games/<slug>/sessions/<id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a session, a DM, a superuser, and a regular user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.session = GameSession.objects.create(game=self.game, title='Old Session')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the session detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            f'/games/test-game/sessions/{self.session.id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_game_master_can_patch(self, client):
        """Test that a DM of the game can update a session and receives 200."""
        response = self._patch(client, {'title': 'New Session'}, token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['title'] == 'New Session'

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update a session and receives 200."""
        response = self._patch(client, {'title': 'New Session'}, token=self.superuser_token)
        assert response.status_code == 200

    def test_patch_persists_changes(self, client):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(
            client, {'title': 'Updated Session', 'date': '2026-02-02'}, token=self.dm_token
        )
        self.session.refresh_from_db()
        assert self.session.title == 'Updated Session'
        assert str(self.session.date) == '2026-02-02'

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token returns 401."""
        response = self._patch(client, {'title': 'Hacked Session'})
        assert response.status_code == 401

    def test_patch_with_non_game_master_returns_403(self, client):
        """Test that PATCH from a non-DM, non-superuser returns 403."""
        response = self._patch(client, {'title': 'Hacked Session'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_session_returns_404(self, client):
        """Test that PATCH on a non-existent session returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}
        response = client.patch(
            '/games/test-game/sessions/999999.json',
            data=json.dumps({'title': 'Ghost'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(client, {'title': 'Partial Update'}, token=self.dm_token)
        self.session.refresh_from_db()
        assert self.session.title == 'Partial Update'

    def test_patch_invalid_payload_returns_400(self, client):
        """Test that PATCH with an invalid payload returns 400."""
        response = self._patch(client, {'title': ''}, token=self.dm_token)
        assert response.status_code == 400
