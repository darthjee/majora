"""Tests for the PC treasure acquire endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterTreasure, Game, GameMaster, Player, Treasure


@pytest.mark.django_db
class TestGamePcTreasureAcquireView:
    """Tests for POST /games/<slug>/pcs/<id>/treasures/acquire.json."""

    def setup_method(self):
        """Set up a game, a PC with money, an owning player, a DM, and a treasure."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Aragorn Player')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = Character.objects.create(
            name='Aragorn', game=self.game, npc=False, player=self.player, money=1000,
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = User.objects.create_user(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = Treasure.objects.create(name='Potion of Healing', value=100, game=self.game)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/treasures/acquire.json'

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

    def test_owner_can_acquire_treasure(self, client):
        """Test that the owning player can acquire a treasure, updating quantity and money."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 3}, token=self.owner_token,
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 700}

    def test_acquire_creates_character_treasure_row(self, client):
        """Test that a CharacterTreasure row is created on the first acquire."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self.owner_token,
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.quantity == 2

    def test_acquire_adds_to_existing_quantity(self, client):
        """Test that acquiring again adds to the existing owned quantity."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self.owner_token,
        )
        assert response.json() == {'quantity': 3, 'money': 800}

    def test_dm_can_acquire_treasure(self, client):
        """Test that a DM of the game can acquire treasure on behalf of a PC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.dm_token,
        )
        assert response.status_code == 200

    def test_insufficient_funds_returns_400(self, client):
        """Test that acquiring more than affordable returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 100}, token=self.owner_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 1000

    def test_treasure_not_in_game_returns_404(self, client):
        """Test that a treasure not available in this game returns 404."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        other_treasure = Treasure.objects.create(name='Orb', value=10, game=other_game)
        response = self._post(
            client, {'treasure_id': other_treasure.id, 'quantity': 1}, token=self.owner_token,
        )
        assert response.status_code == 404

    def test_unknown_treasure_id_returns_404(self, client):
        """Test that a non-existent treasure_id returns 404."""
        response = self._post(
            client, {'treasure_id': 99999, 'quantity': 1}, token=self.owner_token,
        )
        assert response.status_code == 404

    def test_missing_treasure_id_returns_400(self, client):
        """Test that a missing treasure_id returns 400."""
        response = self._post(client, {'quantity': 1}, token=self.owner_token)
        assert response.status_code == 400

    def test_missing_quantity_returns_400(self, client):
        """Test that a missing quantity returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id}, token=self.owner_token,
        )
        assert response.status_code == 400

    def test_zero_quantity_returns_400(self, client):
        """Test that a quantity of 0 returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 0}, token=self.owner_token,
        )
        assert response.status_code == 400

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'treasure_id': self.treasure.id, 'quantity': 1})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the PC is rejected with 403."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.owner_token, game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.owner_token, character_id=99999,
        )
        assert response.status_code == 404

    def test_npc_id_returns_404(self, client):
        """Test that an NPC id used on the PC endpoint returns 404."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self.owner_token, character_id=npc.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-treasure-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.owner_token.key}',
        )
        assert response.status_code == 200
