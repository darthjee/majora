"""Tests for the PC treasure sell endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
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
class TestGamePcTreasureSellView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/treasures/sell.json."""

    def setup_method(self):
        """Set up a game, a PC owning a treasure, with an owning player/user, a DM."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Aragorn Player')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player, money=100,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = TreasureFactory(name='Potion of Healing', value=50, game=self.game)
        self.character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=5,
        )

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the sell endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/treasures/sell.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the sell endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_sell_treasure(self, client):
        """Test that an authorized editor can sell treasure, updating quantity and money."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 200}

    def test_selling_delisted_treasure_still_succeeds(self, client):
        """Test that selling a still-owned treasure succeeds after it's delisted from the game."""
        self.treasure.game = None
        self.treasure.save()

        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 200}

    def test_selling_full_quantity_keeps_row_at_zero(self, client):
        """Test that selling the entire owned quantity keeps the row instead of deleting it."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 5}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 0, 'money': 350}
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.quantity == 0
        assert CharacterTreasure.objects.filter(id=self.character_treasure.id).exists()

    def test_over_selling_returns_400(self, client):
        """Test that selling more than owned returns 400 and leaves the quantity unchanged."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 6}, token=self._editor_token(),
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.quantity == 5

    def test_selling_never_owned_treasure_returns_404(self, client):
        """Test that selling a treasure never owned by the character returns 404."""
        other_treasure = TreasureFactory(name='Orb', value=10, game=self.game)
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
            'game-pc-treasure-sell',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 200

    def test_dm_can_sell_treasure(self, client):
        """Test that a DM of the game can sell treasure on behalf of a PC."""
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

    def test_missing_quantity_returns_400(self, client):
        """Test that a missing quantity returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id}, token=self._editor_token(),
        )
        assert response.status_code == 400
