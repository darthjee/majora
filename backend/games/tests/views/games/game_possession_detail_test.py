"""Tests for the game possession detail view (GET detail / PATCH update)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GamePossessionFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGamePossessionDetailView(TestCase):
    """Tests for the GET /games/<slug>/possessions/<possession_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, possession_id, game_slug='test-game'):
        """Return the possession detail URL for the given possession (defaults to fixture)."""
        return f'/games/{game_slug}/possessions/{possession_id}.json'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that the detail response includes id, name, description, and photo_path."""
        possession = GamePossessionFactory(
            game=self.game, name='The Rusty Anchor', description='A cozy tavern.',
        )
        response = self.client.get(self._url(possession.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == possession.id
        assert data['name'] == 'The Rusty Anchor'
        assert data['description'] == 'A cozy tavern.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        possession = GamePossessionFactory(game=self.game, name='House')
        response = self.client.get(self._url(possession.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_possession(self):
        """Test that a hidden possession is not visible on the public route."""
        possession = GamePossessionFactory(game=self.game, name='Hidden Vault', hidden=True)
        response = self.client.get(self._url(possession.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_possession(self):
        """Test that 404 is returned for a non-existent possession id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_possession_in_wrong_game(self):
        """Test that 404 is returned when the possession belongs to a different game."""
        possession = GamePossessionFactory(game=self.other_game, name='Silver Manor')
        response = self.client.get(self._url(possession.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        possession = GamePossessionFactory(game=self.game, name='House')
        response = self.client.get(self._url(possession.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        possession = GamePossessionFactory(game=self.game, name='House')
        url = reverse(
            'game-possession-detail',
            kwargs={'game_slug': 'test-game', 'possession_id': possession.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGamePossessionDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/possessions/<possession_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and a possession."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.possession = GamePossessionFactory(
            game=self.game, name='The Rusty Anchor', description='A cozy tavern.',
        )

    def _url(self, possession_id=None, game_slug='test-game'):
        """Return the possession detail URL for the given possession (defaults to fixture)."""
        possession_id = possession_id if possession_id is not None else self.possession.id
        return f'/games/{game_slug}/possessions/{possession_id}.json'

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
        self.possession.refresh_from_db()
        assert self.possession.name == 'The Rusty Anchor'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the possession and returns 200."""
        response = self.patch(
            client,
            self._url(),
            {'name': 'The Golden Anchor', 'hidden': True},
            token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'The Golden Anchor'
        assert data['hidden'] is True
        self.possession.refresh_from_db()
        assert self.possession.name == 'The Golden Anchor'
        assert self.possession.hidden is True

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the possession and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'Super House'}, token=token)
        assert response.status_code == 200
        self.possession.refresh_from_db()
        assert self.possession.name == 'Super House'

    def test_patch_can_update_hidden_possession(self, client):
        """Test that a DM can PATCH an already-hidden possession (excluded from public GET)."""
        self.possession.hidden = True
        self.possession.save()
        response = self.patch(
            client, self._url(), {'name': 'Still Hidden Vault'}, token=self.dm_token,
        )
        assert response.status_code == 200
        self.possession.refresh_from_db()
        assert self.possession.name == 'Still Hidden Vault'

    def test_patch_blank_name_returns_400(self, client):
        """Test that a blank name is rejected with 400 — GamePossession has no fallback."""
        response = self.patch(client, self._url(), {'name': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body (only hidden) leaves name/description untouched."""
        response = self.patch(client, self._url(), {'hidden': True}, token=self.dm_token)
        assert response.status_code == 200
        self.possession.refresh_from_db()
        assert self.possession.hidden is True
        assert self.possession.name == 'The Rusty Anchor'
        assert self.possession.description == 'A cozy tavern.'

    def test_patch_returns_404_for_unknown_possession(self, client):
        """Test that PATCH on a non-existent possession id returns 404."""
        response = self.patch(
            client, self._url(possession_id=99999), {'name': 'New Name'}, token=self.dm_token,
        )
        assert response.status_code == 404
