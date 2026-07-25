"""Tests for the game document photos-list endpoint."""

import json

import pytest
from django.urls import reverse

from games.models import GameDocumentPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGameDocumentPhotosView(TokenAuthRequestMixin):
    """Tests for GET /games/<game_slug>/documents/<document_id>/photos.json."""

    def setup_method(self):
        """Set up a game and a document."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')

    def _url(self, document_id=None, game_slug=None):
        """Return the photos list URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.document.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/documents/{document_id}/photos.json'

    def test_returns_empty_list_when_no_photos(self, client):
        """Test that an empty list is returned when the document has no photos."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_photos(self, client):
        """Test that only ready photos are returned."""
        GameDocumentPhoto.objects.create(
            path='photos/games/epic-quest/documents/1/ready.png',
            game_document=self.document,
            ready=True,
        )
        GameDocumentPhoto.objects.create(
            path='photos/games/epic-quest/documents/1/not-ready.png',
            game_document=self.document,
            ready=False,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['path'] == 'photos/games/epic-quest/documents/1/ready.png'

    def test_returns_id_and_path_fields(self, client):
        """Test that list items include id and path fields."""
        photo = GameDocumentPhoto.objects.create(
            path='photos/games/epic-quest/documents/1/scroll.png',
            game_document=self.document,
            ready=True,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['id'] == photo.id
        assert data[0]['path'] == photo.path

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
            GameDocumentPhoto.objects.create(
                path=f'photos/games/epic-quest/documents/1/photo-{i}.png',
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
            'game-document-photos',
            kwargs={'game_slug': 'epic-quest', 'document_id': self.document.id},
        )
        response = client.get(url)
        assert response.status_code == 200
