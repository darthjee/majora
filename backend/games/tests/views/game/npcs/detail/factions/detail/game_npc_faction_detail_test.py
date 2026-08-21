"""Tests for the NPC faction detail view (GET)."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGameNpcFactionDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/factions/<faction_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, faction_id, character_id=None, game_slug='test-game'):
        """Return the faction detail URL for the given faction (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/factions/{faction_id}.json'

    def test_returns_id_game_faction_id_name_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction,
        )
        response = client.get(self._url(character_faction.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_faction.id
        assert data['game_faction_id'] == game_faction.id
        assert data['name'] == 'The Silver Hand'

    def test_returns_404_for_hidden_character_faction(self, client):
        """Test that a hidden character faction is not visible on the public route."""
        game_faction = GameFactionFactory(game=self.game, name='Hidden Faction')
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction, hidden=True,
        )
        response = client.get(self._url(character_faction.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a non-existent faction id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction,
        )
        url = reverse(
            'game-npc-faction-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'faction_id': character_faction.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200
