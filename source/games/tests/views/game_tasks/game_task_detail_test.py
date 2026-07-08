"""Tests for the game task detail view (PATCH update only, no GET)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession, Task
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


@pytest.mark.django_db
class TestGameTaskDetailPatchView:
    """Tests for the PATCH /games/<slug>/tasks/<id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a task, a DM, a superuser, and a regular user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.task = Task.objects.create(game=self.game, short_description='Old description')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, payload, token=None, game_slug=None, task_id=None):
        """Issue a PATCH request to the task detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = (
            f'/games/{game_slug or self.game.game_slug}/tasks/'
            f'{task_id if task_id is not None else self.task.id}.json'
        )
        return client.patch(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_patch(self, client):
        """Test that a DM of the game can update a task and receives 200."""
        response = self._patch(
            client, {'short_description': 'New description'}, token=self.dm_token
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['short_description'] == 'New description'

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update a task and receives 200."""
        response = self._patch(
            client, {'short_description': 'New description'}, token=self.superuser_token
        )
        assert response.status_code == 200

    def test_patch_persists_changes(self, client):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(
            client,
            {'short_description': 'Updated', 'long_description': 'Notes', 'completed': True},
            token=self.dm_token,
        )
        self.task.refresh_from_db()
        assert self.task.short_description == 'Updated'
        assert self.task.long_description == 'Notes'
        assert self.task.completed is True

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token returns 401."""
        response = self._patch(client, {'short_description': 'Hacked'})
        assert response.status_code == 401

    def test_patch_with_non_game_master_returns_403(self, client):
        """Test that PATCH from a non-DM, non-superuser returns 403."""
        response = self._patch(client, {'short_description': 'Hacked'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_task_returns_404(self, client):
        """Test that PATCH on a non-existent task returns 404."""
        response = self._patch(
            client, {'short_description': 'Ghost'}, token=self.dm_token, task_id=999999,
        )
        assert response.status_code == 404

    def test_patch_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._patch(
            client, {'short_description': 'Ghost'}, token=self.dm_token,
            game_slug='unknown-game',
        )
        assert response.status_code == 404

    def test_patch_returns_404_when_task_belongs_to_different_game(self, client):
        """Test that 404 is returned when task_id does not belong to game_slug."""
        response = self._patch(
            client, {'short_description': 'Hacked'}, token=self.dm_token,
            game_slug=self.other_game.game_slug,
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(client, {'short_description': 'Partial Update'}, token=self.dm_token)
        self.task.refresh_from_db()
        assert self.task.short_description == 'Partial Update'
        assert self.task.completed is False

    def test_patch_can_set_session(self, client):
        """Test that PATCH can set the task's session to one belonging to the same game."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        response = self._patch(client, {'session': session.id}, token=self.dm_token)
        assert response.status_code == 200
        self.task.refresh_from_db()
        assert self.task.session == session

    def test_patch_can_clear_session(self, client):
        """Test that PATCH can clear the task's session by passing null."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        self.task.session = session
        self.task.save()
        response = self._patch(client, {'session': None}, token=self.dm_token)
        assert response.status_code == 200
        self.task.refresh_from_db()
        assert self.task.session is None

    def test_patch_session_from_different_game_returns_400(self, client):
        """Test that a session belonging to a different game is rejected with 400."""
        other_session = GameSession.objects.create(game=self.other_game, title='Other Session')
        response = self._patch(client, {'session': other_session.id}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'session' in data['errors']

    def test_patch_game_field_in_payload_is_ignored(self, client):
        """Test that a game field in the payload is ignored — the task's game never changes."""
        response = self._patch(
            client,
            {'short_description': 'Updated', 'game': self.other_game.id},
            token=self.dm_token,
        )
        assert response.status_code == 200
        self.task.refresh_from_db()
        assert self.task.game == self.game

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-task-detail', kwargs={'game_slug': 'test-game', 'task_id': self.task.id},
        )
        response = client.patch(
            url,
            data=json.dumps({'short_description': 'New description'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 200

    def test_get_not_allowed(self, client):
        """Test that GET is not supported on the task detail route."""
        response = client.get(f'/games/test-game/tasks/{self.task.id}.json')
        assert response.status_code == 405
