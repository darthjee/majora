"""Tests for the dm/admin-only NPC treasure quantity summary endpoint."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
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
class TestGameNpcTreasureSummaryAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/treasures/<treasure_id>/npcs/<character_id>/summary/all.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM, an unrelated user, and a treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.treasure = TreasureFactory(name='Potion of Healing', value=100, game=self.game)

    def _url(self, treasure_id=None, character_id=None, game_slug=None):
        """Return the summary/all endpoint URL (defaults to fixtures)."""
        treasure_id = treasure_id if treasure_id is not None else self.treasure.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/treasures/{treasure_id}/npcs/{character_id}/summary/all.json'

    def test_returns_the_owned_quantity(self, client):
        """Test that quantity reflects the CharacterTreasure row's quantity field."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=5,
        )
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'quantity': 5}

    def test_dm_can_view_summary(self, client):
        """Test that the game's DM can view the full summary."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_can_view_summary(self, client):
        """Test that a superuser can view the full summary."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_non_dm_authenticated_user_returns_403(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_hidden_npc_reachable_by_dm(self, client):
        """Test that a hidden NPC's summary is reachable by the DM."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(client, self._url(character_id=hidden_npc.id), token=self.dm_token)
        assert response.status_code == 200

    def test_non_dm_gets_same_status_for_hidden_and_unknown_npc(self, client):
        """Test a non-dm caller cannot distinguish a hidden NPC from a nonexistent one."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        hidden_response = self.get(
            client, self._url(character_id=hidden_npc.id), token=self.other_token,
        )
        unknown_response = self.get(
            client, self._url(character_id=99999), token=self.other_token,
        )
        assert hidden_response.status_code == unknown_response.status_code == 403

    def test_unauthenticated_gets_same_status_for_hidden_and_unknown_npc(self, client):
        """Test an unauthenticated caller cannot distinguish a hidden NPC from a nonexistent one."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        hidden_response = self.get(client, self._url(character_id=hidden_npc.id))
        unknown_response = self.get(client, self._url(character_id=99999))
        assert hidden_response.status_code == unknown_response.status_code == 401

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_treasure(self, client):
        """Test that 404 is returned for a treasure not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_treasure = TreasureFactory(name='Orb', value=10, game=other_game)
        response = self.get(
            client, self._url(treasure_id=other_treasure.id), token=self.dm_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-treasure-npc-summary-all',
            kwargs={
                'game_slug': self.game.game_slug,
                'treasure_id': self.treasure.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcTreasureSummaryAllHiddenTreasure(TokenAuthRequestMixin):
    """Tests for the /all.json summary endpoint against a hidden (GameTreasure.hidden) treasure."""

    def setup_method(self):
        """Set up a game, a DM, a visible NPC, and a hidden treasure the NPC owns some of."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.treasure = TreasureFactory(name='Secret Gem', value=100, game=self.game)
        GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=3,
        )

    def _url(self):
        """Return the summary/all endpoint URL for the hidden treasure fixtures."""
        return (
            f'/games/{self.game.game_slug}/treasures/{self.treasure.id}/'
            f'npcs/{self.character.id}/summary/all.json'
        )

    def test_dm_can_view_the_owned_quantity_of_a_hidden_treasure(self, client):
        """Test that the DM-only /all.json variant bypasses the hidden-treasure gate."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'quantity': 3}
