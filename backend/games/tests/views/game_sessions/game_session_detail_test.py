"""Tests for the game session detail view (GET detail / PATCH update)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


class TestGameSessionDetailView(TestCase):
    """Tests for the GET /games/<slug>/sessions/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a session for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')

    def test_returns_session_detail(self):
        """Test that session detail is returned for a valid id."""
        response = self.client.get(f'/games/test-game/sessions/{self.session.id}.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == self.session.id
        assert data['title'] == 'Session One'
        assert data['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_session_id(self):
        """Test that 404 is returned for a non-existent session id."""
        response = self.client.get('/games/test-game/sessions/999999.json')
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get(f'/games/unknown-game/sessions/{self.session.id}.json')
        assert response.status_code == 404

    def test_returns_404_when_session_belongs_to_different_game(self):
        """Test that 404 is returned when session_id does not belong to game_slug."""
        response = self.client.get(f'/games/other-game/sessions/{self.session.id}.json')
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-session-detail',
            kwargs={'game_slug': 'test-game', 'session_id': self.session.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


class TestGameSessionDetailPatchView(TestCase):
    """Tests for the PATCH /games/<slug>/sessions/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, a superuser, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Old Session')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

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

    def test_game_master_can_patch(self):
        """Test that a DM of the game can update a session and receives 200."""
        response = self._patch(self.client, {'title': 'New Session'}, token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['title'] == 'New Session'

    def test_superuser_can_patch(self):
        """Test that a superuser can update a session and receives 200."""
        response = self._patch(self.client, {'title': 'New Session'}, token=self.superuser_token)
        assert response.status_code == 200

    def test_patch_persists_changes(self):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(
            self.client, {'title': 'Updated Session', 'date': '2026-02-02'}, token=self.dm_token
        )
        self.session.refresh_from_db()
        assert self.session.title == 'Updated Session'
        assert str(self.session.date) == '2026-02-02'

    def test_patch_without_token_returns_401(self):
        """Test that PATCH without a token returns 401."""
        response = self._patch(self.client, {'title': 'Hacked Session'})
        assert response.status_code == 401

    def test_patch_with_non_game_master_returns_403(self):
        """Test that PATCH from a non-DM, non-superuser returns 403."""
        response = self._patch(self.client, {'title': 'Hacked Session'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_session_returns_404(self):
        """Test that PATCH on a non-existent session returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}
        response = self.client.patch(
            '/games/test-game/sessions/999999.json',
            data=json.dumps({'title': 'Ghost'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(self.client, {'title': 'Partial Update'}, token=self.dm_token)
        self.session.refresh_from_db()
        assert self.session.title == 'Partial Update'

    def test_patch_invalid_payload_returns_400(self):
        """Test that PATCH with an invalid payload returns 400."""
        response = self._patch(self.client, {'title': ''}, token=self.dm_token)
        assert response.status_code == 400
