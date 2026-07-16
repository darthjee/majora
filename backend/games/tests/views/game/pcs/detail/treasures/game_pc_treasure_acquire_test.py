"""Tests for the PC treasure acquire endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure, GameTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcTreasureAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/treasures/acquire.json."""

    def setup_method(self):
        """Set up a game, a PC with money, a DM, an unrelated user, and a treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Aragorn Player')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player, money=1000,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = TreasureFactory(name='Potion of Healing', value=100, game=self.game)

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/treasures/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_acquire_treasure(self, client):
        """Test that an authorized editor can acquire treasure on behalf of the character."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 3}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 700, 'acquired': 3}

    def test_acquire_cost_uses_game_treasure_value_when_it_differs_from_treasure_value(
        self, client,
    ):
        """Test that acquire cost is computed from GameTreasure.value, not Treasure.value."""
        GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=10)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 3}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 970, 'acquired': 3}

    def test_acquire_creates_character_treasure_row(self, client):
        """Test that a CharacterTreasure row is created on the first acquire."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.quantity == 1

    def test_insufficient_funds_returns_400(self, client):
        """Test that acquiring more than affordable returns 400 and leaves money unchanged."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 100}, token=self._editor_token(),
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']
        self.character.refresh_from_db()
        assert self.character.money == 1000

    def test_treasure_not_in_game_returns_404(self, client):
        """Test that a treasure not available in this game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_treasure = TreasureFactory(name='Orb', value=10, game=other_game)
        response = self._post(
            client, {'treasure_id': other_treasure.id, 'quantity': 1}, token=self._editor_token(),
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
            token=self._editor_token(), game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self._editor_token(), character_id=99999,
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self._editor_token(), character_id=other.id,
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
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 200

    def test_acquire_adds_to_existing_quantity(self, client):
        """Test that acquiring again adds to the existing owned quantity."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        assert response.json() == {'quantity': 3, 'money': 800, 'acquired': 2}

    def test_dm_can_acquire_treasure(self, client):
        """Test that a DM of the game can acquire treasure on behalf of a PC."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self.dm_token,
        )
        assert response.status_code == 200

    def test_unknown_treasure_id_returns_404(self, client):
        """Test that a non-existent treasure_id returns 404."""
        response = self._post(
            client, {'treasure_id': 99999, 'quantity': 1}, token=self._editor_token(),
        )
        assert response.status_code == 404

    def test_missing_treasure_id_returns_400(self, client):
        """Test that a missing treasure_id returns 400."""
        response = self._post(client, {'quantity': 1}, token=self._editor_token())
        assert response.status_code == 400

    def test_missing_quantity_returns_400(self, client):
        """Test that a missing quantity returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id}, token=self._editor_token(),
        )
        assert response.status_code == 400

    def test_zero_quantity_returns_400(self, client):
        """Test that a quantity of 0 returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 0}, token=self._editor_token(),
        )
        assert response.status_code == 400
