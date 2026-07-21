"""Tests for the NPC documents/all.json view (DM/superuser only, includes hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterDocument
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
class TestGameNpcDocumentsAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/documents/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, an NPC, and visible/hidden documents."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.visible_document = GameDocumentFactory(game=self.game, name='Visible Scroll')
        self.hidden_document = GameDocumentFactory(game=self.game, name='Hidden Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=self.visible_document,
        )
        CharacterDocument.objects.create(
            character=self.character, game_document=self.hidden_document, hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the documents/all URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/documents/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_with_both_visible_and_hidden_documents(self, client):
        """Test that a DM gets 200 with both visible and hidden documents."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert 'Visible Scroll' in names
        assert 'Hidden Scroll' in names

    def test_superuser_gets_200_with_both_visible_and_hidden_documents(self, client):
        """Test that a superuser gets 200 with both visible and hidden documents."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_hidden_field_per_document(self, client):
        """Test that each document carries its own hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        by_name = {document['name']: document['hidden'] for document in data}
        assert by_name['Visible Scroll'] is False
        assert by_name['Hidden Scroll'] is True

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the index-all endpoint."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert all('description' not in document for document in data)

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = self.get(client, self._url(game_slug='unknown-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-documents-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
