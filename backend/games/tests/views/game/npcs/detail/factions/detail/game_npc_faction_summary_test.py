"""Tests for the NPC faction membership summary endpoint (open to everyone, hidden-gated)."""

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
class TestGameNpcFactionSummaryView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/factions/<faction_id>/npcs/<character_id>/summary.json."""

    def setup_method(self):
        """Set up a game, an NPC, and a game faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, faction_id=None, character_id=None, game_slug=None):
        """Return the summary endpoint URL (defaults to fixtures)."""
        faction_id = faction_id if faction_id is not None else self.game_faction.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/factions/{faction_id}/npcs/{character_id}/summary.json'

    def test_returns_false_when_not_enlisted(self, client):
        """Test that enlisted is False when the NPC does not belong to the faction."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == {'enlisted': False}

    def test_returns_true_when_enlisted(self, client):
        """Test that enlisted is True when a CharacterFaction row links the NPC to the faction."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'enlisted': True}

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-faction-npc-summary',
            kwargs={
                'game_slug': self.game.game_slug,
                'faction_id': self.game_faction.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameNpcFactionSummaryHiddenNpc(TokenAuthRequestMixin):
    """Tests for the summary endpoint's hidden-NPC gate."""

    def setup_method(self):
        """Set up a game, a DM, a hidden NPC, and a game faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self):
        """Return the summary endpoint URL for the hidden NPC fixtures."""
        return (
            f'/games/{self.game.game_slug}/factions/{self.game_faction.id}/'
            f'npcs/{self.hidden_npc.id}/summary.json'
        )

    def test_anonymous_gets_404_for_a_hidden_npc(self, client):
        """Test that the regular summary endpoint 404s for a hidden NPC anonymously."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_dm_gets_200_for_a_hidden_npc(self, client):
        """Test that the DM still gets 200 for a hidden NPC on the regular endpoint."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
