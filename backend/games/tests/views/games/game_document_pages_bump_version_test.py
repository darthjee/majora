"""Tests for the game document pages batch version-bump endpoints."""

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
class TestGameDocumentPagesBumpVersionView(TokenAuthRequestMixin):
    """Tests for PATCH /games/<game_slug>/documents/<document_id>/pages/bump_version.json."""

    def setup_method(self):
        """Set up a game, a document with pages, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.page_one = GameDocumentPage.objects.create(
            game_document=self.document, content='Page one', order=1, version=1,
        )
        self.page_two = GameDocumentPage.objects.create(
            game_document=self.document, content='Page two', order=2, version=1,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, document_id=None, game_slug='epic-quest'):
        """Return the bump-version URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        return f'/games/{game_slug}/documents/{document_id}/pages/bump_version.json'

    def test_player_can_bump_non_excluded_pages(self, client):
        """Test that a regular player can bump the version of non-excluded pages."""
        response = self.patch(
            client, self._url(), {'version': 2, 'exclude_ids': [self.page_two.id]},
            token=self.player_token,
        )
        assert response.status_code == 200
        self.page_one.refresh_from_db()
        self.page_two.refresh_from_db()
        assert self.page_one.version == 2
        assert self.page_two.version == 1

    def test_bump_archives_pre_save_state(self, client):
        """Test that a bumped page's pre-save state is archived."""
        self.patch(
            client, self._url(), {'version': 2, 'exclude_ids': [self.page_two.id]},
            token=self.player_token,
        )
        history = GameDocumentPageHistory.objects.get(game_document=self.document)
        assert history.version == 1
        assert history.content == 'Page one'
        assert history.order == 1

    def test_bump_without_exclude_ids_bumps_all_pages(self, client):
        """Test that omitting exclude_ids bumps every page of the document."""
        self.patch(client, self._url(), {'version': 3}, token=self.player_token)
        self.page_one.refresh_from_db()
        self.page_two.refresh_from_db()
        assert self.page_one.version == 3
        assert self.page_two.version == 3

    def test_dm_can_bump_pages(self, client):
        """Test that the game's DM can bump the version of pages."""
        response = self.patch(client, self._url(), {'version': 2}, token=self.dm_token)
        assert response.status_code == 200

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.patch(client, self._url(), {'version': 2})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self.patch(client, self._url(), {'version': 2}, token=self.other_token)
        assert response.status_code == 403

    def test_missing_version_returns_400(self, client):
        """Test that a missing version returns 400."""
        response = self.patch(client, self._url(), {}, token=self.player_token)
        assert response.status_code == 400

    def test_returns_404_for_hidden_document(self, client):
        """Test that bumping a hidden document's pages returns 404 on the regular endpoint."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Scroll', hidden=True)
        response = self.patch(
            client, self._url(document_id=hidden_document.id), {'version': 2},
            token=self.player_token,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-pages-bump-version',
            kwargs={'game_slug': 'epic-quest', 'document_id': self.document.id},
        )
        response = self.patch(client, url, {'version': 2}, token=self.player_token)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameDocumentPagesBumpVersionAllView(TokenAuthRequestMixin):
    """Tests for PATCH /games/<slug>/documents/<document_id>/pages/bump_version/all.json."""

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

    def _url(self, document_id=None, game_slug='test-game'):
        """Return the restricted bump-version URL for the given document (default fixture)."""
        document_id = document_id if document_id is not None else self.hidden_document.id
        return f'/games/{game_slug}/documents/{document_id}/pages/bump_version/all.json'

    def test_dm_can_bump_hidden_document_pages(self, client):
        """Test that a DM can bump the version of a hidden document's pages."""
        response = self.patch(client, self._url(), {'version': 2}, token=self.dm_token)
        assert response.status_code == 200
        self.page.refresh_from_db()
        assert self.page.version == 2

    def test_superuser_can_bump_hidden_document_pages(self, client):
        """Test that a superuser can bump the version of a hidden document's pages."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'version': 2}, token=token)
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.patch(client, self._url(), {'version': 2}, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.patch(client, self._url(), {'version': 2})
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.patch(client, self._url(), {'version': 2}, token=self.other_token)
        assert response.status_code == 403

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-pages-bump-version-all',
            kwargs={'game_slug': 'test-game', 'document_id': self.hidden_document.id},
        )
        response = self.patch(client, url, {'version': 2}, token=self.dm_token)
        assert response.status_code == 200
