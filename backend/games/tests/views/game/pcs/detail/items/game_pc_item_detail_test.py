"""Tests for the PC item detail view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


@pytest.mark.django_db
class TestGamePcItemDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, item_id, character_id=None, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture character)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/items/{item_id}.json'

    def test_returns_id_game_item_id_name_description_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_item.id
        assert data['game_item_id'] == game_item.id
        assert data['name'] == 'Prized Gem'
        assert data['description'] == 'Very shiny.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing detail."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_character_item(self, client):
        """Test that a hidden character item is not visible on the public route."""
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item, hidden=True,
        )
        response = client.get(self._url(character_item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_item(self, client):
        """Test that 404 is returned for a non-existent item id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id, character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(character=other, game_item=game_item)
        response = client.get(self._url(character_item.id, character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        url = reverse(
            'game-pc-item-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'item_id': character_item.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200
