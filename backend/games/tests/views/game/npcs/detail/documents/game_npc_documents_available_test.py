"""Tests for the NPC documents/available.json view."""

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
class TestGameNpcDocumentsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/documents/available.json."""

    def setup_method(self):
        """Set up a game, an NPC, an owned document, an available document, and a hidden one."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.owned_document = GameDocumentFactory(game=self.game, name='Owned Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=self.owned_document,
        )
        self.available_document = GameDocumentFactory(game=self.game, name='Available Scroll')
        self.hidden_document = GameDocumentFactory(
            game=self.game, name='Hidden Scroll', hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the documents/available URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/documents/available.json'

    def test_excludes_owned_documents(self, client):
        """Test that already-owned game documents are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert 'Owned Scroll' not in names
        assert 'Available Scroll' in names

    def test_excludes_hidden_documents(self, client):
        """Test that hidden game documents are excluded from the plain catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert 'Hidden Scroll' not in names

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-documents-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcDocumentsAvailableHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_documents_available."""

    def setup_method(self):
        """Set up a hidden NPC and a DM able to bypass the gate."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )

    def _url(self, character=None):
        """Return the documents/available URL for the given character (defaults to hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/documents/available.json'

    def test_hidden_npc_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's available documents gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's available documents."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's available documents."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
