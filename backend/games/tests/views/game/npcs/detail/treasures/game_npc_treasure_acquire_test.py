"""Tests for the NPC treasure acquire endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure, GameTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameTreasureFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcTreasureAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/treasures/acquire.json."""

    def setup_method(self):
        """Set up a game, an NPC with money, a DM, an unrelated user, and a treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True, money=1000)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = TreasureFactory(name='Staff of Power', value=200, game=self.game)

    def _editor_token(self):
        """Return the DM's token (the NPC's editor)."""
        return self.dm_token

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/treasures/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_acquire_treasure(self, client):
        """Test that an authorized editor can acquire treasure on behalf of the character."""
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 2, 'money': 1000, 'acquired': 2}

    def test_acquire_creates_character_treasure_row(self, client):
        """Test that a CharacterTreasure row is created on the first acquire."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=self._editor_token(),
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.quantity == 1

    def test_acquire_sets_character_treasure_total_value(self, client):
        """Test that acquiring sets total_value to quantity * Treasure.value."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.total_value == 400

    def test_acquire_sets_total_value_using_game_treasure_value_when_it_differs(self, client):
        """Test that total_value is computed from GameTreasure.value, not Treasure.value."""
        GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=20)
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 2}, token=self._editor_token(),
        )
        character_treasure = CharacterTreasure.objects.get(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.total_value == 40

    def test_acquire_never_changes_character_money(self, client):
        """Test that acquiring treasure never changes the character's money."""
        self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 5}, token=self._editor_token(),
        )
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
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1},
            token=self._editor_token(), character_id=other.id,
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
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 200

    def test_superuser_can_acquire_treasure(self, client):
        """Test that a superuser can acquire treasure on behalf of an NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=token,
        )
        assert response.status_code == 200

    def test_staff_can_acquire_treasure(self, client):
        """Test that a global Staff user, not the DM, can acquire treasure on behalf of an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'treasure_id': self.treasure.id, 'quantity': 1}, token=staff_token,
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcTreasureAcquireHidden(TokenAuthRequestMixin):
    """Tests for acquiring treasure on behalf of a hidden NPC."""

    def setup_method(self):
        """Set up a game, a hidden NPC with money, a DM, and a treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True, money=1000,
        )
        self.treasure = TreasureFactory(name='Hidden Gem', value=100, game=self.game)

    def _post(self, client, token=None):
        """Issue a POST request to acquire a treasure for the hidden NPC."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures/acquire.json',
            {'treasure_id': self.treasure.id, 'quantity': 1},
            token=token,
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
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, token=token)
        assert response.status_code == 403


@pytest.mark.django_db
class TestGameNpcTreasureAcquireHiddenTreasure(TokenAuthRequestMixin):
    """Tests for acquiring a treasure that is hidden (GameTreasure.hidden) for the game."""

    def setup_method(self):
        """Set up a game, a DM, an NPC with money, and a hidden treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True, money=1000)
        self.treasure = TreasureFactory(name='Secret Gem', value=100, game=self.game)
        GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )

    def _post(self, client, token=None, url='acquire.json'):
        """Issue a POST request to acquire the hidden treasure."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.character.id}/treasures/{url}',
            {'treasure_id': self.treasure.id, 'quantity': 1},
            token=token,
        )

    def test_dm_gets_404_acquiring_a_hidden_treasure(self, client):
        """Test that acquiring a hidden treasure returns 404, even for the DM."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 404
        self.character.refresh_from_db()
        assert self.character.money == 1000

    def test_dm_can_acquire_a_hidden_treasure_via_the_all_variant(self, client):
        """Test that the DM-only /acquire/all.json variant bypasses the hidden-treasure gate."""
        response = self._post(client, token=self.dm_token, url='acquire/all.json')
        assert response.status_code == 200
        assert response.json() == {'quantity': 1, 'money': 1000, 'acquired': 1}


@pytest.mark.django_db
class TestCharacterTreasureAcquireStockCap(TokenAuthRequestMixin):
    """Tests for the acquire endpoint's stock-cap behavior on M2M-linked treasures."""

    def setup_method(self):
        """Set up a game, a DM, an NPC with money, and a treasure linked via the M2M."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Frodo', game=self.game, npc=True, money=1000)
        self.treasure = TreasureFactory(name='Limited Gem', value=10)
        self.game.treasures.add(self.treasure, through_defaults={'value': self.treasure.value})

    def _acquire(self, client, quantity):
        """Issue a POST request acquiring `quantity` of the limited treasure for the NPC."""
        return self.post(
            client,
            f'/games/test-game/npcs/{self.character.id}/treasures/acquire.json',
            {'treasure_id': self.treasure.id, 'quantity': quantity},
            token=self.dm_token,
        )

    def _set_cap(self, max_units, acquired_units=0):
        """Set max_units/acquired_units on the GameTreasure row for the limited treasure."""
        GameTreasure.objects.filter(game=self.game, treasure=self.treasure).update(
            max_units=max_units, acquired_units=acquired_units,
        )

    def test_acquire_partially_fulfills_when_over_requesting(self, client):
        """Test that requesting more than available caps the acquired amount, not rejects it."""
        self._set_cap(max_units=3)
        response = self._acquire(client, 10)
        assert response.status_code == 200
        assert response.json() == {'quantity': 3, 'money': 1000, 'acquired': 3}

    def test_acquire_records_acquired_units_on_game_treasure(self, client):
        """Test that acquiring increments the through-row's acquired_units."""
        self._set_cap(max_units=5)
        self._acquire(client, 2)
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        assert game_treasure.acquired_units == 2

    def test_acquire_when_fully_depleted_returns_zero_acquired(self, client):
        """Test that acquiring an already fully-depleted treasure succeeds with acquired: 0."""
        self._set_cap(max_units=2, acquired_units=2)
        response = self._acquire(client, 1)
        assert response.status_code == 200
        assert response.json() == {'quantity': 0, 'money': 1000, 'acquired': 0}

    def test_acquire_unlimited_treasure_is_never_capped(self, client):
        """Test that a treasure without a max_units cap acquires the full requested quantity."""
        response = self._acquire(client, 50)
        assert response.json()['acquired'] == 50
