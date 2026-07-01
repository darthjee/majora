"""Tests for the game master detail (DELETE) view."""

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster


@pytest.mark.django_db
class TestGameMasterDetailView:

    """Tests for the game master detail (DELETE) endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.user = User.objects.create_user(username='dm_user', password='secret-password')
        self.game_master = GameMaster.objects.create(game=self.game, user=self.user)

    def _delete(self, client, token=None, game_master_id=None):
        gm_id = game_master_id if game_master_id is not None else self.game_master.id
        url = f'/games/{self.game.game_slug}/game-masters/{gm_id}.json'
        headers = {'HTTP_AUTHORIZATION': f'Token {token}'} if token else {}
        return client.delete(url, **headers)

    def test_delete_requires_authentication(self, client):
        """Test that DELETE returns 401 when unauthenticated."""
        response = self._delete(client)
        assert response.status_code == 401

    def test_delete_removes_game_master(self, client):
        """Test that DELETE removes the game master assignment."""
        token = Token.objects.create(user=self.user)
        response = self._delete(client, token=token)
        assert response.status_code == 204
        assert not GameMaster.objects.filter(id=self.game_master.id).exists()

    def test_delete_by_superuser_removes_any_game_master(self, client):
        """Test that a superuser can delete any game master assignment."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._delete(client, token=token)
        assert response.status_code == 204
        assert not GameMaster.objects.filter(id=self.game_master.id).exists()

    def test_delete_by_other_user_returns_403(self, client):
        """Test that a non-superuser who is not the DM cannot delete the assignment."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._delete(client, token=token)
        assert response.status_code == 403

    def test_delete_returns_404_for_unknown_id(self, client):
        """Test that DELETE returns 404 for an unknown game master id."""
        token = Token.objects.create(user=self.user)
        response = self._delete(client, token=token, game_master_id=99999)
        assert response.status_code == 404

    def test_delete_removes_game_master_via_session_cookie(self, client):
        """Test that DELETE removes the game master for a cookie-authenticated user."""
        token = Token.objects.create(user=self.user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        url = f'/games/{self.game.game_slug}/game-masters/{self.game_master.id}.json'
        response = client.delete(url)
        assert response.status_code == 204
        assert not GameMaster.objects.filter(id=self.game_master.id).exists()
