"""Tests for the NPC items/available.json view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


@pytest.mark.django_db
class TestGameNpcItemsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/items/available.json."""

    def setup_method(self):
        """Set up a game, an NPC, an owned item, an available item, and a hidden item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.owned_item = GameItemFactory(game=self.game, name='Owned Gem')
        CharacterItem.objects.create(character=self.character, game_item=self.owned_item)
        self.available_item = GameItemFactory(game=self.game, name='Available Gem')
        self.hidden_item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the items/available URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/items/available.json'

    def test_excludes_owned_items(self, client):
        """Test that already-owned game items are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Owned Gem' not in names
        assert 'Available Gem' in names

    def test_excludes_hidden_items(self, client):
        """Test that hidden game items are excluded from the plain catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Hidden Gem' not in names

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-items-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
