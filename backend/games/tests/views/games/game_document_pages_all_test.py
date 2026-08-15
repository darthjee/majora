"""Tests for the game document pages/all.json view (DM/superuser only, includes hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameDocumentPage
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameDocumentPagesAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/documents/<document_id>/pages/all.json."""

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
            game_document=self.hidden_document, content='Secret text', order=1,
        )

    def _url(self, document_id=None, game_slug='test-game'):
        """Return the pages/all URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.hidden_document.id
        return f'/games/{game_slug}/documents/{document_id}/pages/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_for_hidden_document_pages(self, client):
        """Test that a DM gets 200 with pages from a hidden document."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data[0]['id'] == self.page.id

    def test_superuser_gets_200_for_hidden_document_pages(self, client):
        """Test that a superuser gets 200 with pages from a hidden document."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_returns_pages_for_visible_document_too(self, client):
        """Test that pages are also returned for a visible (non-hidden) document."""
        visible_document = GameDocumentFactory(game=self.game, name='Public Notice')
        GameDocumentPage.objects.create(
            game_document=visible_document, content='Public text', order=1,
        )
        response = self.get(
            client, self._url(document_id=visible_document.id), token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document id."""
        response = self.get(client, self._url(document_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = self.get(client, self._url(game_slug='unknown-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['page'] == '1'

    def test_per_page_one_returns_single_item_and_total_pages_header(self, client):
        """Test that per_page=1 returns a single item and the correct total pages header."""
        for i in range(2, 4):
            GameDocumentPage.objects.create(
                game_document=self.hidden_document, content=f'Page {i}', order=i,
            )
        response = self.get(
            client, f'{self._url()}?per_page=1&page=2', token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert response['pages'] == '3'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-pages-all',
            kwargs={'game_slug': 'test-game', 'document_id': self.hidden_document.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
