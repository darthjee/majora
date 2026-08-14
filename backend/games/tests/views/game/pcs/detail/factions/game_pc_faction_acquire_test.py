"""Tests for the PC faction acquire (enlist) endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactionFactory,
    GameFactory,
    PlayerFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcFactionAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/factions/acquire.json."""

    def setup_method(self):
        """Set up a game, a PC, a DM, an unrelated user, and an available game faction."""
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
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/factions/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_acquire_faction(self, client):
        """Test that an authorized editor can enlist into an existing game faction."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self._editor_token(),
        )
        assert response.status_code == 201

    def test_acquire_creates_character_faction_row(self, client):
        """Test that a CharacterFaction row is created linking the character to the faction."""
        self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self._editor_token(),
        )
        assert CharacterFaction.objects.filter(
            character=self.character, game_faction=self.game_faction,
        ).exists()

    def test_acquire_response_includes_expected_fields(self, client):
        """Test that the response exposes the acquired CharacterFaction's detail fields."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['game_faction_id'] == self.game_faction.id
        assert data['name'] == 'The Silver Hand'
        assert data['hidden'] is False

    def test_hidden_defaults_to_false_when_omitted(self, client):
        """Test that hidden defaults to False when omitted (GameFaction has no hidden field)."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is False

    def test_hidden_respects_submitted_value(self, client):
        """Test that an explicit hidden value is respected."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id, 'hidden': True},
            token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_already_enlisted_returns_422(self, client):
        """Test that acquiring an already-enlisted faction returns 422 (not 400)."""
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self._editor_token(),
        )
        assert response.status_code == 422
        data = json.loads(response.content)
        assert 'game_faction_id' in data['errors']
        assert data['errors']['game_faction_id'] == ['game_faction_already_enlisted']

    def test_game_faction_not_in_game_returns_404(self, client):
        """Test that a game faction not available in this game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_faction = GameFactionFactory(game=other_game, name='Foreign Faction')
        response = self._post(
            client, {'game_faction_id': other_faction.id}, token=self._editor_token(),
        )
        assert response.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'game_faction_id': self.game_faction.id})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id},
            token=self._editor_token(), game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id},
            token=self._editor_token(), character_id=99999,
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self._post(
            client, {'game_faction_id': self.game_faction.id},
            token=self._editor_token(), character_id=other.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-faction-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_faction_id': self.game_faction.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 201

    def test_dm_can_acquire_faction(self, client):
        """Test that a DM of the game can enlist a PC into a faction."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.dm_token,
        )
        assert response.status_code == 201

    def test_staff_can_acquire_faction(self, client):
        """Test that a global Staff user, neither owner nor DM, can enlist a PC into a faction."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=staff_token,
        )
        assert response.status_code == 201

    def test_plain_player_can_acquire_faction(self, client):
        """Test that a plain player of the game (not staff/owner/dm) can enlist another PC."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.plain_player_token,
        )
        assert response.status_code == 201

    def test_unknown_game_faction_id_returns_404(self, client):
        """Test that a non-existent game_faction_id returns 404."""
        response = self._post(client, {'game_faction_id': 99999}, token=self._editor_token())
        assert response.status_code == 404

    def test_missing_game_faction_id_returns_400(self, client):
        """Test that a missing game_faction_id returns 400."""
        response = self._post(client, {}, token=self._editor_token())
        assert response.status_code == 400
