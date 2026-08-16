"""Tests for the game document page detail (update) endpoints."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameDocumentPage, GameDocumentPageHistory
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameDocumentPageDetailView(TokenAuthRequestMixin):
    """Tests for PATCH /games/<game_slug>/documents/<document_id>/pages/<page_id>.json."""

    def setup_method(self):
        """Set up a game, a document with a page, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.page = GameDocumentPage.objects.create(
            game_document=self.document, content='Original text', order=1, version=1,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, page_id=None, document_id=None, game_slug='epic-quest'):
        """Return the page detail URL for the given page (defaults to fixture)."""
        page_id = page_id if page_id is not None else self.page.id
        document_id = document_id if document_id is not None else self.document.id
        return f'/games/{game_slug}/documents/{document_id}/pages/{page_id}.json'

    def test_player_can_update_page(self, client):
        """Test that a regular player can update a page of a non-hidden document."""
        response = self.patch(
            client, self._url(), {'content': 'New text', 'version': 2}, token=self.player_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['content'] == 'New text'
        assert data['version'] == 2

    def test_update_persists_new_content_and_version(self, client):
        """Test that the update endpoint persists the new content and version."""
        self.patch(
            client, self._url(), {'content': 'New text', 'version': 2}, token=self.player_token,
        )
        self.page.refresh_from_db()
        assert self.page.content == 'New text'
        assert self.page.version == 2

    def test_update_archives_pre_save_state(self, client):
        """Test that the update endpoint archives the page's pre-save state."""
        self.patch(
            client, self._url(), {'content': 'New text', 'version': 2}, token=self.player_token,
        )
        history = GameDocumentPageHistory.objects.get(game_document=self.document)
        assert history.content == 'Original text'
        assert history.version == 1
        assert history.order == 1

    def test_dm_can_update_page(self, client):
        """Test that the game's DM can update a page of a non-hidden document."""
        response = self.patch(
            client, self._url(), {'content': 'New text', 'version': 2}, token=self.dm_token,
        )
        assert response.status_code == 200

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.patch(client, self._url(), {'content': 'New text', 'version': 2})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self.patch(
            client, self._url(), {'content': 'New text', 'version': 2}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_missing_version_returns_400(self, client):
        """Test that a missing version returns 400."""
        response = self.patch(
            client, self._url(), {'content': 'New text'}, token=self.player_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'version' in data['errors']

    def test_returns_404_for_hidden_document(self, client):
        """Test that updating a page of a hidden document returns 404 on the regular endpoint."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Scroll', hidden=True)
        hidden_page = GameDocumentPage.objects.create(
            game_document=hidden_document, content='Secret', order=1, version=1,
        )
        response = self.patch(
            client, self._url(page_id=hidden_page.id, document_id=hidden_document.id),
            {'content': 'New text', 'version': 2}, token=self.player_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_unknown_page(self, client):
        """Test that updating a non-existent page returns 404."""
        response = self.patch(
            client, self._url(page_id=99999), {'content': 'New text', 'version': 2},
            token=self.player_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_page_belonging_to_other_document(self, client):
        """Test that a page id belonging to another document returns 404."""
        other_document = GameDocumentFactory(game=self.game, name='Other Document')
        other_page = GameDocumentPage.objects.create(
            game_document=other_document, content='Other text', order=1, version=1,
        )
        response = self.patch(
            client, self._url(page_id=other_page.id), {'content': 'New text', 'version': 2},
            token=self.player_token,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-page-detail',
            kwargs={
                'game_slug': 'epic-quest', 'document_id': self.document.id,
                'page_id': self.page.id,
            },
        )
        response = self.patch(
            client, url, {'content': 'New text', 'version': 2}, token=self.player_token,
        )
        assert response.status_code == 200

    def test_id_and_game_document_are_not_included(self, client):
        """Test that id and game_document in the payload have no effect on the updated page."""
        other_document = GameDocumentFactory(game=self.game, name='Other Document')
        response = self.patch(
            client, self._url(),
            {
                'content': 'New text', 'version': 2,
                'id': 99999, 'game_document': other_document.id,
            },
            token=self.player_token,
        )
        assert response.status_code == 200
        self.page.refresh_from_db()
        assert self.page.id != 99999
        assert self.page.game_document_id == self.document.id


@pytest.mark.django_db
class TestGameDocumentPageDetailAllView(TokenAuthRequestMixin):
    """Tests for PATCH /games/<slug>/documents/<document_id>/pages/<page_id>/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and a hidden document with a page."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.hidden_document = GameDocumentFactory(
            game=self.game, name='Secret Letter', hidden=True,
        )
        self.page = GameDocumentPage.objects.create(
            game_document=self.hidden_document, content='Secret text', order=1, version=1,
        )

    def _url(self, page_id=None, document_id=None, game_slug='test-game'):
        """Return the restricted page detail URL for the given page (defaults to fixture)."""
        page_id = page_id if page_id is not None else self.page.id
        document_id = document_id if document_id is not None else self.hidden_document.id
        return f'/games/{game_slug}/documents/{document_id}/pages/{page_id}/all.json'

    def test_dm_can_update_hidden_document_page(self, client):
        """Test that a DM can update a page belonging to a hidden document."""
        response = self.patch(
            client, self._url(), {'content': 'New secret text', 'version': 2},
            token=self.dm_token,
        )
        assert response.status_code == 200

    def test_superuser_can_update_hidden_document_page(self, client):
        """Test that a superuser can update a page belonging to a hidden document."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(
            client, self._url(), {'content': 'New secret text', 'version': 2}, token=token,
        )
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.patch(
            client, self._url(), {'content': 'New secret text', 'version': 2},
            token=self.dm_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.patch(client, self._url(), {'content': 'New secret text', 'version': 2})
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.patch(
            client, self._url(), {'content': 'New secret text', 'version': 2},
            token=self.other_token,
        )
        assert response.status_code == 403

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-page-detail-all',
            kwargs={
                'game_slug': 'test-game', 'document_id': self.hidden_document.id,
                'page_id': self.page.id,
            },
        )
        response = self.patch(
            client, url, {'content': 'New secret text', 'version': 2}, token=self.dm_token,
        )
        assert response.status_code == 200
