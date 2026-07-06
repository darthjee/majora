"""Tests for the NPC treasure sell endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterTreasure, Game, GameMaster, Treasure


@pytest.mark.django_db
class TestGameNpcTreasureSellView:
    """Tests for POST /games/<slug>/npcs/<id>/treasures/sell.json."""

    def setup_method(self):
        """Set up a game, an NPC owning a treasure, a DM, and a treasure."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(
            name='Gandalf', game=self.game, npc=True, money=100,
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
        self.character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=4,
        )

    def _url(self, character_id=None, game_slug=None):
        """Return the sell endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/treasures/sell.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the sell endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(character_id, game_slug),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_dm_can_sell_treasure(self, client):
        """Test that a DM can sell treasure on behalf of an NPC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.dm_token,
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 300}

    def test_selling_full_quantity_keeps_row_at_zero(self, client):
        """Test that selling the entire owned quantity keeps the row instead of deleting it."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 4}, token=self.dm_token,
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 0, 'money': 900}
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.quantity == 0
        assert CharacterTreasure.objects.filter(id=self.character_treasure.id).exists()

    def test_superuser_can_sell_treasure(self, client):
        """Test that a superuser can sell treasure on behalf of an NPC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.superuser_token,
        )
        assert response.status_code == 200

    def test_over_selling_returns_400(self, client):
        """Test that selling more than owned returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 5}, token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']

    def test_selling_never_owned_treasure_returns_404(self, client):
        """Test that selling a treasure never owned by the character returns 404."""
        other_treasure = Treasure.objects.create(name='Orb', value=10, game=self.game)
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
            'game-npc-treasure-sell',
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
class TestGameNpcTreasureSellHidden:
    """Tests for selling treasure on behalf of a hidden NPC."""

    def setup_method(self):
        """Set up a game, a hidden NPC owning a treasure, and a DM."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = Character.objects.create(
            name='Secret NPC', game=self.game, npc=True, hidden=True, money=0,
        )
        self.treasure = Treasure.objects.create(name='Hidden Gem', value=100, game=self.game)
        CharacterTreasure.objects.create(
            character=self.hidden_npc, treasure=self.treasure, quantity=1,
        )

    def _post(self, client, token=None):
        """Issue a POST request to sell a treasure for the hidden NPC."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures/sell.json',
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            **extra,
        )

    def test_dm_can_sell_for_hidden_npc(self, client):
        """Test that a DM can sell treasure for a hidden NPC."""
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
