"""Tests for the PC factions/available.json view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGamePcFactionsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/factions/available.json."""

    def setup_method(self):
        """Set up a game, a PC, an enlisted faction, and an available faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.enlisted_faction = GameFactionFactory(game=self.game, name='Enlisted Faction')
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.enlisted_faction,
        )
        self.available_faction = GameFactionFactory(game=self.game, name='Available Faction')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the factions/available URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/factions/available.json'

    def test_excludes_enlisted_factions(self, client):
        """Test that already-enlisted factions are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [faction['name'] for faction in data]
        assert 'Enlisted Faction' not in names
        assert 'Available Faction' in names

    def test_returns_id_name_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        response = client.get(self._url())
        data = json.loads(response.content)
        entry = next(faction for faction in data if faction['name'] == 'Available Faction')
        assert entry['id'] == self.available_faction.id
        assert entry['photo_path'] is None
        assert 'hidden' not in entry

    def test_name_filter_is_case_insensitive(self, client):
        """Test that the `name` query param filters case-insensitively."""
        response = client.get(f'{self._url()}?name=available')
        data = json.loads(response.content)
        names = [faction['name'] for faction in data]
        assert names == ['Available Faction']

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-factions-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
