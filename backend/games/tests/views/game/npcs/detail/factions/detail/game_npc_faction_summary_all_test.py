"""Tests for the dm/admin-only NPC faction membership summary endpoint."""

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
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcFactionSummaryAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/factions/<faction_id>/npcs/<character_id>/summary/all.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM, an unrelated user, and a game faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, faction_id=None, character_id=None, game_slug=None):
        """Return the summary/all endpoint URL (defaults to fixtures)."""
        faction_id = faction_id if faction_id is not None else self.game_faction.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/factions/{faction_id}/npcs/{character_id}/summary/all.json'

    def test_returns_true_when_enlisted(self, client):
        """Test that enlisted reflects an existing CharacterFaction row."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'enlisted': True}

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

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a faction not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_faction = GameFactionFactory(game=other_game, name='Foreign Faction')
        response = self.get(
            client, self._url(faction_id=other_faction.id), token=self.dm_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-faction-npc-summary-all',
            kwargs={
                'game_slug': self.game.game_slug,
                'faction_id': self.game_faction.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
