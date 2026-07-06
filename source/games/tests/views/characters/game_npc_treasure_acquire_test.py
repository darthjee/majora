"""Tests for the NPC treasure acquire endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterTreasure, Game, GameMaster, Treasure


@pytest.mark.django_db
class TestGameNpcTreasureAcquireView:
    """Tests for POST /games/<slug>/npcs/<id>/treasures/acquire.json."""

    def setup_method(self):
        """Set up a game, an NPC with money, a DM, and a treasure."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(
            name='Gandalf', game=self.game, npc=True, money=1000,
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = User.objects.create_superuser(
            username='admin', password='secret-password'
        )
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.other_user = User.objects.create_user(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = Treasure.objects.create(name='Staff of Power', value=200, game=self.game)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/treasures/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(character_id, game_slug),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_dm_can_acquire_treasure(self, client):
        """Test that a DM can acquire treasure on behalf of an NPC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self.dm_token,
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 2, 'money': 600}

    def test_acquire_creates_character_treasure_row(self, client):
        """Test that a CharacterTreasure row is created on the first acquire."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.dm_token,
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.quantity == 1

    def test_superuser_can_acquire_treasure(self, client):
        """Test that a superuser can acquire treasure on behalf of an NPC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.superuser_token,
        )
        assert response.status_code == 200

    def test_insufficient_funds_returns_400(self, client):
        """Test that acquiring more than affordable returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 100}, token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']

    def test_treasure_not_in_game_returns_404(self, client):
        """Test that a treasure not available in this game returns 404."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        other_treasure = Treasure.objects.create(name='Orb', value=10, game=other_game)
        response = self._post(
            client, {'treasure_id': other_treasure.id, 'quantity': 1}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'treasure_id': self.treasure.id, 'quantity': 1})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.dm_token, game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.dm_token, character_id=99999,
        )
        assert response.status_code == 404

    def test_pc_id_returns_404(self, client):
        """Test that a PC id used on the NPC endpoint returns 404."""
        pc = Character.objects.create(name='Aragorn', game=self.game, npc=False)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.dm_token, character_id=pc.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-treasure-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcTreasureAcquireHidden:
    """Tests for acquiring treasure on behalf of a hidden NPC."""

    def setup_method(self):
        """Set up a game, a hidden NPC with money, a DM, and a treasure."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = Character.objects.create(
            name='Secret NPC', game=self.game, npc=True, hidden=True, money=1000,
        )
        self.treasure = Treasure.objects.create(name='Hidden Gem', value=100, game=self.game)

    def _post(self, client, token=None):
        """Issue a POST request to acquire a treasure for the hidden NPC."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures/acquire.json',
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            **extra,
        )

    def test_dm_can_acquire_for_hidden_npc(self, client):
        """Test that a DM can acquire treasure for a hidden NPC."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 200

    def test_anonymous_returns_401_for_hidden_npc(self, client):
        """Test that an anonymous request for a hidden NPC returns 401."""
        response = self._post(client)
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_hidden_npc(self, client):
        """Test that an unrelated authenticated user returns 403 for a hidden NPC."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, token=token)
        assert response.status_code == 403
