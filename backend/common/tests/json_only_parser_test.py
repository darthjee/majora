"""Tests that DRF views only accept JSON request bodies (#1618)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import Task
from games.tests.factories import GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestJsonOnlyParser:
    """Tests that a session-authenticated write refuses every non-JSON body with 415."""

    def setup_method(self):
        """Set up a game, its DM and a session-authenticated client."""
        self.game = GameFactory(game_slug='test-game')
        self.user = UserFactory()
        PlayerFactory(game=self.game, user=self.user, is_dm=True)
        self.client = self._session_client()
        self.url = f'/games/{self.game.game_slug}/tasks.json'

    def _session_client(self):
        """Return an APIClient authenticated by a session cookie holding the DM's token."""
        client = APIClient()
        session = client.session
        session['auth_token'] = Token.objects.get_or_create(user=self.user)[0].key
        session.save()
        return client

    def test_form_encoded_body_gives_415(self):
        """Test that a form-encoded body gives 415 and creates nothing."""
        response = self.client.post(
            self.url, 'short_description=Ambush',
            content_type='application/x-www-form-urlencoded',
        )
        assert response.status_code == 415
        assert not Task.objects.exists()

    def test_multipart_body_gives_415(self):
        """Test that a multipart body gives 415 and creates nothing."""
        response = self.client.post(
            self.url, {'short_description': 'Ambush'}, format='multipart',
        )
        assert response.status_code == 415
        assert not Task.objects.exists()

    def test_text_plain_body_gives_415(self):
        """Test that a `text/plain` body gives 415 and creates nothing."""
        response = self.client.post(
            self.url, '{"short_description": "Ambush"}', content_type='text/plain',
        )
        assert response.status_code == 415
        assert not Task.objects.exists()

    def test_json_body_succeeds(self):
        """Test that the same request with a JSON body creates the task."""
        response = self.client.post(
            self.url, {'short_description': 'Ambush'}, format='json',
        )
        assert response.status_code == 201
        assert Task.objects.filter(game=self.game).count() == 1
