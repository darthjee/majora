"""End-to-end tests for the `@token_scopes` declarations of the document views (issue #1633)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import GameDocumentPage
from games.tests.factories import GameDocumentFactory, GameFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin


class DocumentScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, a visible and a hidden document."""

    def setup_method(self):
        """Set up the game, its members, the documents and a page of the visible document."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.hidden_document = GameDocumentFactory(game=self.game, name='Secret', hidden=True)
        self.page = GameDocumentPage.objects.create(
            game_document=self.document, content='Original text', order=1, version=1,
        )

    def _document_url(self, suffix='.json', document=None):
        """Return the URL of `document` (default: the visible one) followed by `suffix`."""
        document = document or self.document
        return f'/games/test-game/documents/{document.id}{suffix}'

    def _full_url(self):
        """Return the full.json URL of the hidden document."""
        return self._document_url('/full.json', self.hidden_document)


@pytest.mark.django_db
class TestDocumentTokenScopesPublicReads(DocumentScopedTokenMixin):
    """Plain document reads accept a token without any scope."""

    def test_documents_list_needs_no_scope(self):
        """Test that documents.json answers 200 for a token with no scopes."""
        response = self._get('/games/test-game/documents.json', self.player, [])
        assert response.status_code == 200

    def test_document_detail_needs_no_scope(self):
        """Test that documents/<id>.json answers 200 for a token with no scopes."""
        response = self._get(self._document_url(), self.player, [])
        assert response.status_code == 200

    def test_document_pages_needs_no_scope(self):
        """Test that documents/<id>/pages.json answers 200 for a token with no scopes."""
        response = self._get(self._document_url('/pages.json'), self.player, [])
        assert response.status_code == 200


@pytest.mark.django_db
class TestDocumentTokenScopesRestrictedReads(DocumentScopedTokenMixin):
    """Restricted document reads need `documents:read`."""

    def test_documents_all_without_read_is_refused(self):
        """Test that documents/all.json without `documents:read` gives `scope_missing`."""
        response = self._get('/games/test-game/documents/all.json', self.dm, ['documents:write'])
        self._assert_refused(response, 'scope_missing')

    def test_documents_all_with_read_is_allowed(self):
        """Test that documents/all.json with `documents:read` answers 200 for the DM."""
        response = self._get('/games/test-game/documents/all.json', self.dm, ['documents:read'])
        assert response.status_code == 200

    def test_full_without_read_is_refused(self):
        """Test that full.json with an other family's read gives `scope_missing`."""
        response = self._get(self._full_url(), self.dm, ['pcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_full_with_read_is_allowed(self):
        """Test that full.json with `documents:read` answers 200 for the DM."""
        response = self._get(self._full_url(), self.dm, ['documents:read'])
        assert response.status_code == 200


@pytest.mark.django_db
class TestDocumentTokenScopesWrites(DocumentScopedTokenMixin):
    """Document writes need `documents:write`."""

    def _create(self, scopes):
        """POST a new document to documents.json as the DM with `scopes`."""
        return self._post(
            '/games/test-game/documents.json', {'name': 'New Scroll'}, self.dm, scopes,
        )

    def _update_page(self, scopes):
        """PATCH the visible document's page as the player with `scopes`."""
        return self._patch(
            self._document_url(f'/pages/{self.page.id}.json'),
            {'content': 'New text', 'version': 2}, self.player, scopes,
        )

    def test_create_without_write_is_refused(self):
        """Test that documents.json POST with `documents:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['documents:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that documents.json POST with `documents:write` answers 201."""
        assert self._create(['documents:write']).status_code == 201

    def test_page_update_without_write_is_refused(self):
        """Test that pages/<id>.json PATCH with `documents:read` alone gives `scope_missing`."""
        self._assert_refused(self._update_page(['documents:read']), 'scope_missing')

    def test_page_update_with_write_succeeds(self):
        """Test that pages/<id>.json PATCH with `documents:write` answers 200."""
        assert self._update_page(['documents:write']).status_code == 200


@pytest.mark.django_db
class TestDocumentTokenScopesUploads(DocumentScopedTokenMixin):
    """Upload initialisation needs `documents:write`."""

    def _upload(self, scopes):
        """POST the file upload init for the visible document as the DM with `scopes`."""
        return self._post(
            self._document_url('/file_upload.json'), {'filename': 'scroll.pdf'}, self.dm, scopes,
        )

    def test_upload_without_write_is_refused(self):
        """Test that file_upload.json with `documents:read` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['documents:read']), 'scope_missing')

    def test_upload_with_write_succeeds(self):
        """Test that file_upload.json with `documents:write` answers 201."""
        assert self._upload(['documents:write']).status_code == 201


@pytest.mark.django_db
class TestDocumentTokenScopesGames(DocumentScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(self._full_url(), self.dm, ['documents:read'], games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the document's game answers 200."""
        response = self._get(self._full_url(), self.dm, ['documents:read'], games=[self.game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestDocumentTokenScopesOwnerIntersection(DocumentScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_player_full_is_forbidden(self):
        """Test that a player with `documents:read` still gets a role 403 on full.json."""
        self._assert_role_refused(self._get(self._full_url(), self.player, ['documents:read']))

    def test_player_documents_all_is_forbidden(self):
        """Test that a player with `documents:read` still gets a role 403 on documents/all."""
        response = self._get('/games/test-game/documents/all.json', self.player, ['documents:read'])
        self._assert_role_refused(response)


@pytest.mark.django_db
class TestDocumentTokenScopesOtherCredentials(DocumentScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_full(self):
        """Test that the DM's session still reads full.json."""
        self._log_in(self.dm)
        assert self.client.get(self._full_url()).status_code == 200

    def test_session_player_is_forbidden(self):
        """Test that a player's session still gets 403 on full.json."""
        self._log_in(self.player)
        assert self.client.get(self._full_url()).status_code == 403

    def test_legacy_token_dm_creates_document(self):
        """Test that the DM's legacy Token still creates a document."""
        token = Token.objects.create(user=self.dm)
        response = self.client.post(
            '/games/test-game/documents.json', {'name': 'New Scroll'}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201

    def test_legacy_token_player_is_forbidden(self):
        """Test that a player's legacy Token still gets 403 on full.json."""
        token = Token.objects.create(user=self.player)
        response = self.client.get(self._full_url(), HTTP_AUTHORIZATION=f'Token {token.key}')
        assert response.status_code == 403
