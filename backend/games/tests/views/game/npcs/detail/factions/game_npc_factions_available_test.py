"""Tests for the NPC factions/available.json view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGameNpcFactionsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/factions/available.json."""

    def setup_method(self):
        """Set up a game, an NPC, an enlisted faction, and an available faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.enlisted_faction = GameFactionFactory(game=self.game, name='Enlisted Faction')
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.enlisted_faction,
        )
        self.available_faction = GameFactionFactory(game=self.game, name='Available Faction')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the factions/available URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/factions/available.json'

    def test_excludes_enlisted_factions(self, client):
        """Test that already-enlisted factions are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [faction['name'] for faction in data]
        assert 'Enlisted Faction' not in names
        assert 'Available Faction' in names

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-factions-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
