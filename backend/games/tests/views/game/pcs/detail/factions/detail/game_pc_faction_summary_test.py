"""Tests for the PC faction membership summary endpoint (open to everyone)."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGamePcFactionSummaryView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/factions/<faction_id>/pcs/<character_id>/summary.json."""

    def setup_method(self):
        """Set up a game, a PC, and a game faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, faction_id=None, character_id=None, game_slug=None):
        """Return the summary endpoint URL (defaults to fixtures)."""
        faction_id = faction_id if faction_id is not None else self.game_faction.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/factions/{faction_id}/pcs/{character_id}/summary.json'

    def test_returns_false_when_not_enlisted(self, client):
        """Test that enlisted is False when the PC does not belong to the faction."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == {'enlisted': False}

    def test_returns_true_when_enlisted(self, client):
        """Test that enlisted is True when a CharacterFaction row links the PC to the faction."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'enlisted': True}

    def test_accessible_without_authentication(self, client):
        """Test that the endpoint is open to unauthenticated requests."""
        response = self.get(client, self._url())
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a faction not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_faction = GameFactionFactory(game=other_game, name='Foreign Faction')
        response = self.get(client, self._url(faction_id=other_faction.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'))
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self.get(client, self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-faction-pc-summary',
            kwargs={
                'game_slug': self.game.game_slug,
                'faction_id': self.game_faction.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url)
        assert response.status_code == 200
