"""Tests for the NPC document ownership summary endpoint (open to everyone, hidden-npc gated)."""

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
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcDocumentSummaryView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/documents/<document_id>/npcs/<character_id>/summary.json."""

    def setup_method(self):
        """Set up a game, an NPC, and a game document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.game_document = GameDocumentFactory(game=self.game, name='Elven Lore')
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, document_id=None, character_id=None, game_slug=None):
        """Return the summary endpoint URL (defaults to fixtures)."""
        document_id = document_id if document_id is not None else self.game_document.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/documents/{document_id}/npcs/{character_id}/summary.json'

    def test_returns_false_when_not_owned(self, client):
        """Test that owned is False when the NPC does not own the document."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == {'owned': False}

    def test_returns_true_when_owned(self, client):
        """Test that owned is True when a CharacterDocument row links the NPC to the document."""
        CharacterDocument.objects.create(character=self.character, game_document=self.game_document)
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'owned': True}

    def test_accessible_without_authentication(self, client):
        """Test that the endpoint is open to unauthenticated requests, for a non-hidden NPC."""
        response = self.get(client, self._url())
        assert response.status_code == 200

    def test_hidden_npc_returns_404_for_unrelated_user(self, client):
        """Test that a hidden NPC 404s for a user without edit permission."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(
            client, self._url(character_id=hidden_npc.id), token=self.other_token,
        )
        assert response.status_code == 404

    def test_hidden_npc_returns_404_for_unauthenticated(self, client):
        """Test that a hidden NPC 404s for an unauthenticated requester."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(client, self._url(character_id=hidden_npc.id))
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a document not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_document = GameDocumentFactory(game=other_game, name='Orb Codex')
        response = self.get(client, self._url(document_id=other_document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'))
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self.get(client, self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-document-npc-summary',
            kwargs={
                'game_slug': self.game.game_slug,
                'document_id': self.game_document.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcDocumentSummaryHiddenDocument(TokenAuthRequestMixin):
    """Tests for the summary endpoint against a hidden (GameDocument.hidden) document."""

    def setup_method(self):
        """Set up a game, a DM, a visible NPC, and a hidden document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.game_document = GameDocumentFactory(game=self.game, name='Secret Tome', hidden=True)

    def _url(self):
        """Return the summary endpoint URL for the hidden document fixtures."""
        return (
            f'/games/{self.game.game_slug}/documents/{self.game_document.id}/'
            f'npcs/{self.character.id}/summary.json'
        )

    def test_dm_gets_404_for_a_hidden_document(self, client):
        """Test that the regular summary endpoint 404s on a hidden document, even for the DM."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 404
