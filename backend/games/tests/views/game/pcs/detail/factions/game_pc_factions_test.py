"""Tests for the PC factions view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGamePcFactionsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/factions.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the factions list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/factions.json'

    def test_returns_empty_list_when_no_factions(self, client):
        """Test that an empty list is returned when the character belongs to no factions."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_faction_id_name_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_faction.id
        assert data[0]['game_faction_id'] == game_faction.id
        assert data[0]['name'] == 'The Silver Hand'
        assert data[0]['photo_path'] is None

    def test_excludes_hidden_factions(self, client):
        """Test that a hidden character faction is excluded from the response."""
        game_faction = GameFactionFactory(game=self.game, name='Secret Cabal')
        CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing list."""
        game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        CharacterFaction.objects.create(character=self.character, game_faction=game_faction)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

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
            'game-pc-factions',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_returns_factions_ordered_by_id(self, client):
        """Test that factions are returned ordered by id."""
        first_game_faction = GameFactionFactory(game=self.game, name='First Faction')
        second_game_faction = GameFactionFactory(game=self.game, name='Second Faction')
        first = CharacterFaction.objects.create(
            character=self.character, game_faction=first_game_faction,
        )
        second = CharacterFaction.objects.create(
            character=self.character, game_faction=second_game_faction,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [faction['id'] for faction in data] == [first.id, second.id]
