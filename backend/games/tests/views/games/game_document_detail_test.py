"""Tests for the game document detail view (GET detail / PATCH update)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameDocumentDetailView(TestCase):
    """Tests for the GET /games/<slug>/documents/<document_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, document_id, game_slug='test-game'):
        """Return the document detail URL for the given document (defaults to fixture game)."""
        return f'/games/{game_slug}/documents/{document_id}.json'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that the detail response includes id, name, description, and photo_path."""
        document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get(self._url(document.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == document.id
        assert data['name'] == 'Ancient Scroll'
        assert data['description'] == 'A crumbling scroll.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get(self._url(document.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_document(self):
        """Test that a hidden document is not visible on the public route."""
        document = GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get(self._url(document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_document(self):
        """Test that 404 is returned for a non-existent document id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_document_in_wrong_game(self):
        """Test that 404 is returned when the document belongs to a different game."""
        document = GameDocumentFactory(game=self.other_game, name='Treaty of Kings')
        response = self.client.get(self._url(document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get(self._url(document.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        url = reverse(
            'game-document-detail',
            kwargs={'game_slug': 'test-game', 'document_id': document.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameDocumentDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/documents/<document_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a player, an unrelated user, and a document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )

    def _url(self, document_id=None, game_slug='test-game'):
        """Return the document detail URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        return f'/games/{game_slug}/documents/{document_id}.json'

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
        self.document.refresh_from_db()
        assert self.document.name == 'Ancient Scroll'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the document and returns 200."""
        response = self.patch(
            client,
            self._url(),
            {'name': 'Ancient Codex', 'hidden': True},
            token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Ancient Codex'
        assert data['hidden'] is True
        self.document.refresh_from_db()
        assert self.document.name == 'Ancient Codex'
        assert self.document.hidden is True

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the document and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'Super Scroll'}, token=token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.name == 'Super Scroll'

    def test_patch_can_update_hidden_document(self, client):
        """Test that a DM can PATCH an already-hidden document (excluded from public GET)."""
        self.document.hidden = True
        self.document.save()
        response = self.patch(
            client, self._url(), {'name': 'Still Secret Scroll'}, token=self.dm_token,
        )
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.name == 'Still Secret Scroll'

    def test_patch_blank_name_returns_400(self, client):
        """Test that a blank name is rejected with 400 — GameDocument has no fallback."""
        response = self.patch(client, self._url(), {'name': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body (only hidden) leaves name/description untouched."""
        response = self.patch(client, self._url(), {'hidden': True}, token=self.dm_token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.hidden is True
        assert self.document.name == 'Ancient Scroll'
        assert self.document.description == 'A crumbling scroll.'

    def test_patch_returns_404_for_unknown_document(self, client):
        """Test that PATCH on a non-existent document id returns 404."""
        response = self.patch(
            client, self._url(document_id=99999), {'name': 'New Name'}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_staff_user_returns_200(self, client):
        """Test that an is_staff=True user unrelated to the game can PATCH the document."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'Staff Scroll'}, token=token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.name == 'Staff Scroll'

    def test_player_of_game_returns_200(self, client):
        """Test that a player of the game can PATCH the document."""
        response = self.patch(
            client, self._url(), {'name': 'Player Scroll'}, token=self.player_token,
        )
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.name == 'Player Scroll'
