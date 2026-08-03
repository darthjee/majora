"""Tests for the NPC document remove endpoint."""

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
class TestGameNpcDocumentRemoveView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/documents/remove.json."""

    def setup_method(self):
        """Set up a game, an NPC owning a document, a DM, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_document = GameDocumentFactory(game=self.game, name='Elven Lore')
        self.character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )

    def _url(self, character_id=None, game_slug=None):
        """Return the remove endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/documents/remove.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the remove endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_dm_can_remove_document(self, client):
        """Test that a DM of the game can remove a document on behalf of an NPC."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.dm_token,
        )
        assert response.status_code == 204

    def test_remove_deletes_character_document_row(self, client):
        """Test that removing deletes the CharacterDocument row."""
        self._post(client, {'game_document_id': self.game_document.id}, token=self.dm_token)
        assert not CharacterDocument.objects.filter(id=self.character_document.id).exists()

    def test_staff_can_remove_document(self, client):
        """Test that a global Staff user, not a DM, can remove a document for an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=staff_token,
        )
        assert response.status_code == 204

    def test_removing_never_owned_document_returns_404(self, client):
        """Test that removing a game document never owned by the character returns 404."""
        other_document = GameDocumentFactory(game=self.game, name='Orb Codex')
        response = self._post(
            client, {'game_document_id': other_document.id}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_removing_hidden_owned_document_returns_404_via_public_endpoint(self, client):
        """Test that removing an owned-but-hidden document 404s via the public endpoint."""
        hidden_document = GameDocumentFactory(game=self.game, name='Secret Tome')
        hidden_character_document = CharacterDocument.objects.create(
            character=self.character, game_document=hidden_document, hidden=True,
        )
        response = self._post(
            client, {'game_document_id': hidden_document.id}, token=self.dm_token,
        )
        assert response.status_code == 404
        assert CharacterDocument.objects.filter(id=hidden_character_document.id).exists()

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'game_document_id': self.game_document.id})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'game_document_id': self.game_document.id},
            token=self.dm_token, game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'game_document_id': self.game_document.id},
            token=self.dm_token, character_id=99999,
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self._post(
            client, {'game_document_id': self.game_document.id},
            token=self.dm_token, character_id=other.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-document-remove',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_document_id': self.game_document.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 204

    def test_missing_game_document_id_returns_400(self, client):
        """Test that a missing game_document_id returns 400."""
        response = self._post(client, {}, token=self.dm_token)
        assert response.status_code == 400
