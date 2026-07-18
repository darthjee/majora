"""Tests for the PC items view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


@pytest.mark.django_db
class TestGamePcItemsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/items.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the items list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/items.json'

    def test_returns_empty_list_when_no_items(self, client):
        """Test that an empty list is returned when the character has no items."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_item_id_name_description_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_item.id
        assert data[0]['game_item_id'] == game_item.id
        assert data[0]['name'] == 'Prized Gem'
        assert data[0]['description'] == 'Very shiny.'
        assert data[0]['photo_path'] is None

    def test_name_override_takes_precedence(self, client):
        """Test that a character item's own name override is used instead of the game item's."""
        game_item = GameItemFactory(game=self.game, name='Prized Gem')
        CharacterItem.objects.create(
            character=self.character, game_item=game_item, name="Aragorn's Gem",
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['name'] == "Aragorn's Gem"

    def test_excludes_hidden_items(self, client):
        """Test that a hidden character item is excluded from the response."""
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        CharacterItem.objects.create(
            character=self.character, game_item=game_item, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing list."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        CharacterItem.objects.create(character=self.character, game_item=game_item)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-items', kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_returns_items_ordered_by_id(self, client):
        """Test that items are returned ordered by id."""
        first_game_item = GameItemFactory(game=self.game, name='First Gem')
        second_game_item = GameItemFactory(game=self.game, name='Second Gem')
        first = CharacterItem.objects.create(character=self.character, game_item=first_game_item)
        second = CharacterItem.objects.create(
            character=self.character, game_item=second_game_item,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]
