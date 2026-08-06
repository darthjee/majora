"""Tests for the PC document acquire endpoint."""

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
class TestGamePcDocumentAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/documents/acquire.json."""

    def setup_method(self):
        """Set up a game, a PC, a DM, an unrelated user, and an available game document."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Aragorn Player', game=self.game)
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.plain_player_user = UserFactory(username='plain_player', password='secret-password')
        PlayerFactory(game=self.game, user=self.plain_player_user)
        self.plain_player_token = Token.objects.create(user=self.plain_player_user)
        self.game_document = GameDocumentFactory(game=self.game, name='Elven Lore')

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/documents/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_acquire_document(self, client):
        """Test that an authorized editor can acquire an existing game document."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self._editor_token(),
        )
        assert response.status_code == 201

    def test_acquire_creates_character_document_row(self, client):
        """Test that a CharacterDocument row is created linking the character to the document."""
        self._post(
            client, {'game_document_id': self.game_document.id}, token=self._editor_token(),
        )
        assert CharacterDocument.objects.filter(
            character=self.character, game_document=self.game_document,
        ).exists()

    def test_acquire_response_includes_expected_fields(self, client):
        """Test that the response exposes the acquired CharacterDocument's detail fields."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['game_document_id'] == self.game_document.id
        assert data['name'] == 'Elven Lore'
        assert data['description'] == self.game_document.description
        assert data['hidden'] is False

    def test_hidden_defaults_to_game_document_hidden_when_omitted(self, client):
        """Test that hidden defaults to the (non-hidden) GameDocument's own hidden value."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is False

    def test_hidden_respects_submitted_value(self, client):
        """Test that an explicit hidden value overrides the GameDocument's own default."""
        response = self._post(
            client, {'game_document_id': self.game_document.id, 'hidden': True},
            token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_already_owned_returns_422(self, client):
        """Test that acquiring an already-owned game document returns 422 (not 400)."""
        CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self._editor_token(),
        )
        assert response.status_code == 422
        data = json.loads(response.content)
        assert 'game_document_id' in data['errors']

    def test_hidden_game_document_returns_404_via_public_endpoint(self, client):
        """Test that acquiring a hidden game document via the public endpoint 404s, even DM."""
        hidden_document = GameDocumentFactory(
            game=self.game, name='Secret Tome', hidden=True,
        )
        response = self._post(
            client, {'game_document_id': hidden_document.id}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_game_document_not_in_game_returns_404(self, client):
        """Test that a game document not available in this game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_document = GameDocumentFactory(game=other_game, name='Orb Codex')
        response = self._post(
            client, {'game_document_id': other_document.id}, token=self._editor_token(),
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
            token=self._editor_token(), game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'game_document_id': self.game_document.id},
            token=self._editor_token(), character_id=99999,
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self._post(
            client, {'game_document_id': self.game_document.id},
            token=self._editor_token(), character_id=other.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-document-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_document_id': self.game_document.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 201

    def test_dm_can_acquire_document(self, client):
        """Test that a DM of the game can acquire a document on behalf of a PC."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.dm_token,
        )
        assert response.status_code == 201

    def test_staff_can_acquire_document(self, client):
        """Test that a global Staff user, neither owner nor DM, can acquire a document for a PC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=staff_token,
        )
        assert response.status_code == 201

    def test_plain_player_can_acquire_document(self, client):
        """Test that a plain player of the game (not staff/owner/dm) can acquire for another PC."""
        response = self._post(
            client, {'game_document_id': self.game_document.id}, token=self.plain_player_token,
        )
        assert response.status_code == 201

    def test_unknown_game_document_id_returns_404(self, client):
        """Test that a non-existent game_document_id returns 404."""
        response = self._post(client, {'game_document_id': 99999}, token=self._editor_token())
        assert response.status_code == 404

    def test_missing_game_document_id_returns_400(self, client):
        """Test that a missing game_document_id returns 400."""
        response = self._post(client, {}, token=self._editor_token())
        assert response.status_code == 400
