"""Tests for the PC possessions/available.json view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterPossession
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GamePossessionFactory


@pytest.mark.django_db
class TestGamePcPossessionsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/possessions/available.json."""

    def setup_method(self):
        """Set up a game, a PC, an owned possession, an available one, and a hidden one."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.owned_possession = GamePossessionFactory(game=self.game, name='Owned Vault')
        CharacterPossession.objects.create(
            character=self.character, game_possession=self.owned_possession,
        )
        self.available_possession = GamePossessionFactory(game=self.game, name='Available Vault')
        self.hidden_possession = GamePossessionFactory(
            game=self.game, name='Hidden Vault', hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the possessions/available URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/possessions/available.json'

    def test_excludes_owned_possessions(self, client):
        """Test that already-owned game possessions are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Owned Vault' not in names
        assert 'Available Vault' in names

    def test_excludes_hidden_possessions(self, client):
        """Test that hidden game possessions are excluded from the plain catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Hidden Vault' not in names

    def test_returns_id_name_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        response = client.get(self._url())
        data = json.loads(response.content)
        entry = next(item for item in data if item['name'] == 'Available Vault')
        assert entry['id'] == self.available_possession.id
        assert entry['photo_path'] is None
        assert 'hidden' not in entry

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
            'game-pc-possessions-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
