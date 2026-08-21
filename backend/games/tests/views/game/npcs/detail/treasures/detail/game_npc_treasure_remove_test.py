"""Tests for the NPC treasure remove endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure, GameTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcTreasureRemoveView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/treasures/remove.json."""

    def setup_method(self):
        """Set up a game, an NPC owning a treasure, a DM, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True, money=100)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = TreasureFactory(name='Staff of Power', value=200, game=self.game)
        self.character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=4,
        )

    def _editor_token(self):
        """Return the DM's token (the NPC's editor)."""
        return self.dm_token

    def _url(self, character_id=None, game_slug=None):
        """Return the remove endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/treasures/remove.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the remove endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_remove_treasure(self, client):
        """Test that an authorized editor can remove treasure, updating quantity, not money."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 100}

    def test_remove_sets_character_treasure_total_value(self, client):
        """Test that removing sets total_value to remaining quantity * Treasure.value."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.total_value == 600

    def test_remove_sets_total_value_using_game_treasure_value_when_it_differs(self, client):
        """Test that total_value is computed from GameTreasure.value, not Treasure.value."""
        GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=15)
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.total_value == 45

    def test_remove_never_changes_character_money(self, client):
        """Test that removing treasure never changes the character's money."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        self.character.refresh_from_db()
        assert self.character.money == 100

    def test_removing_delisted_treasure_still_succeeds(self, client):
        """Test that removing a still-owned treasure succeeds after it's delisted from the game."""
        self.treasure.game = None
        self.treasure.save()

        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 100}

    def test_removing_full_quantity_keeps_row_at_zero(self, client):
        """Test that removing the entire owned quantity keeps the row instead of deleting it."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 4}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 0, 'money': 100}
        self.character_treasure.refresh_from_db()
        assert self.character_treasure.quantity == 0
        assert CharacterTreasure.objects.filter(id=self.character_treasure.id).exists()

    def test_over_removing_returns_400(self, client):
        """Test that removing more than owned returns 400."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 5}, token=self._editor_token(),
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'quantity' in data['errors']

    def test_removing_never_owned_treasure_returns_404(self, client):
        """Test that removing a treasure never owned by the character returns 404."""
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
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self._editor_token(), character_id=other.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-treasure-remove',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'treasure_id': self.treasure.id, 'quantity': 1}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 200

    def test_superuser_can_remove_treasure(self, client):
        """Test that a superuser can remove treasure on behalf of an NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=token,
        )
        assert response.status_code == 200

    def test_staff_can_remove_treasure(self, client):
        """Test that a global Staff user, not the DM, can remove treasure on behalf of an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=staff_token,
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcTreasureRemoveHidden(TokenAuthRequestMixin):
    """Tests for removing treasure on behalf of a hidden NPC."""

    def setup_method(self):
        """Set up a game, a hidden NPC owning a treasure, and a DM."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True, money=0,
        )
        self.treasure = TreasureFactory(name='Hidden Gem', value=100, game=self.game)
        CharacterTreasure.objects.create(
            character=self.hidden_npc, treasure=self.treasure, quantity=1,
        )

    def _post(self, client, token=None):
        """Issue a POST request to remove a treasure for the hidden NPC."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures/remove.json',
            {'treasure_id': self.treasure.id, 'quantity': 1},
            token=token,
        )

    def test_dm_can_remove_for_hidden_npc(self, client):
        """Test that a DM can remove treasure for a hidden NPC."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 200

    def test_anonymous_returns_401_for_hidden_npc(self, client):
        """Test that an anonymous request for a hidden NPC returns 401."""
        response = self._post(client)
        assert response.status_code == 401

    def test_unrelated_user_returns_403_for_hidden_npc(self, client):
        """Test that an unrelated authenticated user returns 403 for a hidden NPC."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, token=token)
        assert response.status_code == 403


@pytest.mark.django_db
class TestCharacterTreasureRemoveStockCap(TokenAuthRequestMixin):
    """Tests for the remove endpoint releasing stock on M2M-linked treasures."""

    def setup_method(self):
        """Set up a game, a DM, an NPC owning a limited treasure, and its through-row cap."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Frodo', game=self.game, npc=True, money=0)
        self.treasure = TreasureFactory(name='Limited Gem', value=10)
        self.game.treasures.add(self.treasure, through_defaults={'value': self.treasure.value})
        GameTreasure.objects.filter(game=self.game, treasure=self.treasure).update(
            max_units=10, acquired_units=5,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=5,
        )

    def _remove(self, client, quantity):
        """Issue a POST request removing `quantity` of the limited treasure for the NPC."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.character.id}/treasures/remove.json',
            {'treasure_id': self.treasure.id, 'quantity': quantity},
            token=self.dm_token,
        )

    def test_remove_decrements_acquired_units_on_game_treasure(self, client):
        """Test that removing decrements the through-row's acquired_units by the removed amount."""
        response = self._remove(client, 2)
        assert response.status_code == 200
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        assert game_treasure.acquired_units == 3

    def test_remove_increases_available_units(self, client):
        """Test that removing increases the through-row's derived available_units."""
        self._remove(client, 2)
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        assert game_treasure.available_units == 7

    def test_remove_never_drops_acquired_units_below_zero(self, client):
        """Test that acquired_units never goes negative even in an inconsistent state."""
        GameTreasure.objects.filter(game=self.game, treasure=self.treasure).update(
            acquired_units=1,
        )
        response = self._remove(client, 5)
        assert response.status_code == 200
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        assert game_treasure.acquired_units == 0
