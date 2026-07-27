"""Tests for the game document files-list endpoint."""

import json

import pytest
from django.urls import reverse

from games.models import GameDocumentFile, GameDocumentFilePhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGameDocumentFilesView(TokenAuthRequestMixin):
    """Tests for GET /games/<game_slug>/documents/<document_id>/files.json."""

    def setup_method(self):
        """Set up a game and a document."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')

    def _url(self, document_id=None, game_slug=None):
        """Return the files list URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/documents/{document_id}/files.json'

    def test_returns_empty_list_when_no_files(self, client):
        """Test that an empty list is returned when the document has no files."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_files(self, client):
        """Test that only ready files are returned."""
        GameDocumentFile.objects.create(
            path='files/games/epic-quest/documents/1/ready.pdf',
            name='Ready',
            game_document=self.document,
            ready=True,
        )
        GameDocumentFile.objects.create(
            path='files/games/epic-quest/documents/1/not-ready.pdf',
            name='Not Ready',
            game_document=self.document,
            ready=False,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['path'] == 'files/games/epic-quest/documents/1/ready.pdf'

    def test_returns_id_name_path_and_photo_path_fields(self, client):
        """Test that list items include id, name, path and photo_path fields."""
        file = GameDocumentFile.objects.create(
            path='files/games/epic-quest/documents/1/scroll.pdf',
            name='Scroll',
            game_document=self.document,
            ready=True,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['id'] == file.id
        assert data[0]['name'] == file.name
        assert data[0]['path'] == file.path
        assert data[0]['photo_path'] is None

    def test_returns_photo_path_when_photo_attached(self, client):
        """Test that photo_path reflects the file's attached photo."""
        photo = GameDocumentFilePhoto.objects.create(
            path='photos/games/epic-quest/documents/1/scroll-thumb.png',
        )
        GameDocumentFile.objects.create(
            path='files/games/epic-quest/documents/1/scroll.pdf',
            name='Scroll',
            game_document=self.document,
            ready=True,
            photo=photo,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['photo_path'] == 'photos/games/epic-quest/documents/1/scroll-thumb.png'

    def test_returns_404_for_hidden_document(self, client):
        """Test that 404 is returned for a hidden document's files."""
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
            GameDocumentFile.objects.create(
                path=f'files/games/epic-quest/documents/1/file-{i}.pdf',
                name=f'File {i}',
                game_document=self.document,
                ready=True,
            )
        response = client.get(f'{self._url()}?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-files',
            kwargs={'game_slug': 'epic-quest', 'document_id': self.document.id},
        )
        response = client.get(url)
        assert response.status_code == 200
