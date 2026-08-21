"""Tests for the PC document files/all.json view (dm, owner, or admin only)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterDocument, GameDocumentFile
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcDocumentFilesAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/documents/<document_id>/files/all.json."""

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, an unrelated user, and a hidden document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player = PlayerFactory(name='Bob', game=self.game, user=self.owner)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False,
        )
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_document = GameDocumentFactory(game=self.game, name='Hidden Scroll')
        self.hidden_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document, hidden=True,
        )
        self.file = GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/secret.pdf',
            name='Secret',
            game_document=self.game_document,
            ready=True,
        )

    def _url(self, document_id=None, character_id=None, game_slug='test-game'):
        """Return the files/all URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.hidden_document.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/documents/{document_id}/files/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_owner_non_dm_user(self, client):
        """Test that an authenticated user who is not the owner/DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_owner_gets_200_for_hidden_document_files(self, client):
        """Test that the PC's owning player gets 200 with files from a hidden document."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data[0]['id'] == self.file.id
        assert data[0]['character_document_id'] == self.hidden_document.id

    def test_dm_gets_200_for_hidden_document_files(self, client):
        """Test that the game's DM gets 200 with files from a hidden document."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_gets_200_for_hidden_document_files(self, client):
        """Test that a superuser gets 200 with files from a hidden document."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_ignores_incognito(self, client):
        """Test that an incognito character's files still list, unlike the public endpoint."""
        self.character.incognito = True
        self.character.save()
        response = self.get(client, self._url(), token=self.owner_token)
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_only_ready_files(self, client):
        """Test that only ready files are returned."""
        GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/draft.pdf',
            name='Draft',
            game_document=self.game_document,
            ready=False,
        )
        response = self.get(client, self._url(), token=self.owner_token)
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document id."""
        response = self.get(client, self._url(document_id=99999), token=self.owner_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.owner_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-document-files-all',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'document_id': self.hidden_document.id,
            },
        )
        response = self.get(client, url, token=self.owner_token)
        assert response.status_code == 200
