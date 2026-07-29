"""Tests for the NPC document detail/full.json view (DM/superuser only, includes hidden)."""

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
class TestGameNpcDocumentDetailFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/documents/<document_id>/full.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, an NPC, and a hidden document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        game_document = GameDocumentFactory(
            game=self.game, name='Hidden Scroll', description='A crumbling scroll.',
        )
        self.hidden_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document, hidden=True,
        )

    def _url(self, document_id=None, character_id=None, game_slug='test-game'):
        """Return the document detail/full URL for the given document (defaults to fixture)."""
        document_id = document_id if document_id is not None else self.hidden_document.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/documents/{document_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_player_of_game_without_ownership_of_npc_is_rejected(self, client):
        """Test that a mere player of the game (no relation to the NPC) is rejected with 403."""
        player_user = UserFactory(username='player_only', password='secret-password')
        PlayerFactory(game=self.game, user=player_user)
        token = Token.objects.create(user=player_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 403

    def test_dm_gets_200_for_hidden_document(self, client):
        """Test that a DM gets 200 for a hidden document."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Hidden Scroll'

    def test_superuser_gets_200_for_hidden_document(self, client):
        """Test that a superuser gets 200 for a hidden document."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_includes_hidden_field(self, client):
        """Test that the response carries the hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_response_does_not_include_description(self, client):
        """Test that description is not exposed, since no such field exists for documents."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        assert 'description' not in data

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

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-document-detail-full',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'document_id': self.hidden_document.id,
            },
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
