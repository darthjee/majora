"""Tests for the game document pages-list endpoint."""

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
    UserFactory,
)


@pytest.mark.django_db
class TestGameDocumentPagesView(TokenAuthRequestMixin):
    """Tests for GET /games/<game_slug>/documents/<document_id>/pages.json."""

    def setup_method(self):
        """Set up a game and a document."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')

    def _url(self, document_id=None, game_slug=None):
        """Return the pages list URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/documents/{document_id}/pages.json'

    def test_returns_empty_list_when_no_pages(self, client):
        """Test that an empty list is returned when the document has no pages."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_content_and_order_fields(self, client):
        """Test that list items include id, content and order fields."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, content='Once upon a time...', order=1,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['id'] == page.id
        assert data[0]['content'] == page.content
        assert data[0]['order'] == page.order

    def test_returns_version_field(self, client):
        """Test that list items include the version field."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, content='Once upon a time...', order=1, version=2,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['version'] == page.version

    def test_returns_pages_ordered_by_order(self, client):
        """Test that pages are returned ordered by their order field."""
        GameDocumentPage.objects.create(game_document=self.document, content='Second', order=2)
        GameDocumentPage.objects.create(game_document=self.document, content='First', order=1)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['content'] for item in data] == ['First', 'Second']

    def test_returns_404_for_hidden_document(self, client):
        """Test that 404 is returned for a hidden document's pages."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Scroll', hidden=True)
        response = client.get(self._url(document_id=hidden_document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document_id."""
        response = client.get(self._url(document_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_document_in_wrong_game(self, client):
        """Test that 404 is returned when the document belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get(self._url(game_slug='no-such-game'))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(self._url())
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(f'{self._url()}?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameDocumentPage.objects.create(
                game_document=self.document, content=f'Page {i}', order=i,
            )
        response = client.get(f'{self._url()}?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_per_page_one_returns_single_item_and_total_pages_header(self, client):
        """Test that per_page=1 returns a single item and the correct total pages header."""
        for i in range(3):
            GameDocumentPage.objects.create(
                game_document=self.document, content=f'Page {i}', order=i,
            )
        response = client.get(f'{self._url()}?per_page=1&page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert response['pages'] == '3'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-pages',
            kwargs={'game_slug': 'epic-quest', 'document_id': self.document.id},
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameDocumentPagesCreate(TokenAuthRequestMixin):
    """Tests for POST /games/<game_slug>/documents/<document_id>/pages.json."""

    def setup_method(self):
        """Set up a game, a DM, a player of the game, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, document_id=None, game_slug='epic-quest'):
        """Return the pages create URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        return f'/games/{game_slug}/documents/{document_id}/pages.json'

    def test_player_can_create_page(self, client):
        """Test that a regular player can create a page for a non-hidden document."""
        response = self.post(
            client, self._url(), {'content': 'Once upon a time...', 'order': 1, 'version': 1},
            token=self.player_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['content'] == 'Once upon a time...'
        assert data['order'] == 1
        assert data['version'] == 1

    def test_create_persists_page(self, client):
        """Test that the create endpoint persists a GameDocumentPage."""
        self.post(
            client, self._url(), {'content': 'Text', 'order': 1, 'version': 1},
            token=self.player_token,
        )
        assert self.document.pages.count() == 1

    def test_dm_can_create_page(self, client):
        """Test that the game's DM can create a page for a non-hidden document."""
        response = self.post(
            client, self._url(), {'content': 'Text', 'order': 1, 'version': 1},
            token=self.dm_token,
        )
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.post(client, self._url(), {'content': 'Text', 'order': 1, 'version': 1})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self.post(
            client, self._url(), {'content': 'Text', 'order': 1, 'version': 1},
            token=self.other_token,
        )
        assert response.status_code == 403

    def test_missing_order_returns_400(self, client):
        """Test that a missing order returns 400."""
        response = self.post(
            client, self._url(), {'content': 'Text', 'version': 1}, token=self.player_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'order' in data['errors']

    def test_returns_404_for_hidden_document(self, client):
        """Test that creating a page on a hidden document returns 404 on the regular endpoint."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Scroll', hidden=True)
        response = self.post(
            client, self._url(document_id=hidden_document.id),
            {'content': 'Text', 'order': 1, 'version': 1}, token=self.player_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_unknown_document(self, client):
        """Test that creating a page for a non-existent document returns 404."""
        response = self.post(
            client, self._url(document_id=99999), {'content': 'Text', 'order': 1, 'version': 1},
            token=self.player_token,
        )
        assert response.status_code == 404

    def test_id_and_game_document_are_not_included(self, client):
        """Test that id and game_document in the payload have no effect on the created page."""
        other_document = GameDocumentFactory(game=self.game, name='Other Scroll')
        response = self.post(
            client, self._url(),
            {
                'content': 'Text', 'order': 1, 'version': 1,
                'id': 99999, 'game_document': other_document.id,
            },
            token=self.player_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['id'] != 99999
        page = GameDocumentPage.objects.get(id=data['id'])
        assert page.game_document_id == self.document.id


@pytest.mark.django_db
class TestGameDocumentPagesTrim(TokenAuthRequestMixin):
    """Tests for DELETE /games/<game_slug>/documents/<document_id>/pages.json."""

    def setup_method(self):
        """Set up a game, a document with pages, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.pages = [
            GameDocumentPage.objects.create(
                game_document=self.document, content=f'Page {i}', order=i, version=1,
            )
            for i in range(1, 4)
        ]
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, document_id=None, game_slug='epic-quest'):
        """Return the pages trim URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        return f'/games/{game_slug}/documents/{document_id}/pages.json'

    def test_player_can_trim_pages(self, client):
        """Test that a regular player can trim excess pages from a non-hidden document."""
        response = self.delete(
            client, self._url(), payload={'keep': 1}, token=self.player_token,
        )
        assert response.status_code == 204
        assert self.document.pages.count() == 1

    def test_trim_archives_deleted_pages(self, client):
        """Test that trimmed pages are archived into GameDocumentPageHistory."""
        self.delete(client, self._url(), payload={'keep': 1}, token=self.player_token)
        assert GameDocumentPageHistory.objects.filter(game_document=self.document).count() == 2

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.delete(client, self._url(), payload={'keep': 1})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self.delete(
            client, self._url(), payload={'keep': 1}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_returns_404_for_hidden_document(self, client):
        """Test that trimming a hidden document's pages returns 404 on the regular endpoint."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Scroll', hidden=True)
        response = self.delete(
            client, self._url(document_id=hidden_document.id), payload={'keep': 0},
            token=self.player_token,
        )
        assert response.status_code == 404
