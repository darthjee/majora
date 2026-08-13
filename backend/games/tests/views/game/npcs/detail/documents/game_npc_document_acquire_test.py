"""Tests for the NPC document acquire endpoint."""

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
class TestGameNpcDocumentAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/documents/acquire.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM, an unrelated user, and an available game document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.plain_player_user = UserFactory(username='plain_player', password='secret-password')
        PlayerFactory(game=self.game, user=self.plain_player_user)
        self.plain_player_token = Token.objects.create(user=self.plain_player_user)
        self.game_document = GameDocumentFactory(game=self.game, name='Elven Lore')

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/documents/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_dm_can_acquire_document(self, client):
        """Test that a DM of the game can acquire a document on behalf of an NPC."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.dm_token,
        )
        assert response.status_code == 201

    def test_acquire_creates_character_document_row(self, client):
        """Test that a CharacterDocument row is created linking the NPC to the document."""
        self._post(client, {'game_document_id': self.game_document.id}, token=self.dm_token)
        assert CharacterDocument.objects.filter(
            character=self.character, game_document=self.game_document,
        ).exists()

    def test_staff_can_acquire_document(self, client):
        """Test that a global Staff user, not a DM, can acquire a document for an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=staff_token,
        )
        assert response.status_code == 201

    def test_plain_player_can_acquire_document(self, client):
        """Test that a plain player of the game (not staff/dm) can acquire a document for an NPC."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.plain_player_token,
        )
        assert response.status_code == 201

    def test_already_owned_returns_422(self, client):
        """Test that acquiring an already-owned game document returns 422 (not 400)."""
        CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.dm_token,
        )
        assert response.status_code == 422

    def test_hidden_game_document_returns_404_via_public_endpoint(self, client):
        """Test that acquiring a hidden game document via the public endpoint 404s, even DM."""
        hidden_document = GameDocumentFactory(
            game=self.game, name='Secret Tome', hidden=True,
        )
        response = self._post(
            client, {'game_document_id': hidden_document.id}, token=self.dm_token,
        )
        assert response.status_code == 404

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
            'game-npc-document-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_document_id': self.game_document.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 201

    def test_unknown_game_document_id_returns_404(self, client):
        """Test that a non-existent game_document_id returns 404."""
        response = self._post(client, {'game_document_id': 99999}, token=self.dm_token)
        assert response.status_code == 404

    def test_missing_game_document_id_returns_400(self, client):
        """Test that a missing game_document_id returns 400."""
        response = self._post(client, {}, token=self.dm_token)
        assert response.status_code == 400


@pytest.mark.django_db
class TestGameNpcDocumentAcquireHidden(TokenAuthRequestMixin):
    """Tests for acquiring a document on behalf of a hidden NPC."""

    def setup_method(self):
        """Set up a game, a hidden NPC, a DM, and an available game document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.game_document = GameDocumentFactory(game=self.game, name='Secret Tome')

    def _post(self, client, token=None):
        """Issue a POST request to acquire a document for the hidden NPC."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.hidden_npc.id}/documents/acquire.json',
            {'game_document_id': self.game_document.id},
            token=token,
        )

    def test_dm_can_acquire_for_hidden_npc(self, client):
        """Test that a DM can acquire a document for a hidden NPC."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 201

    def test_anonymous_returns_404_for_hidden_npc(self, client):
        """Test that an anonymous request for a hidden NPC returns 404."""
        response = self._post(client)
        assert response.status_code == 404

    def test_unrelated_user_returns_404_for_hidden_npc(self, client):
        """Test that an unrelated authenticated user returns 404 for a hidden NPC."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, token=token)
        assert response.status_code == 404
