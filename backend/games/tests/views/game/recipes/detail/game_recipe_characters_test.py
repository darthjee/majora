"""Tests for the recipe → characters view (AllowAny; 404 for a hidden recipe)."""

import json

import pytest
from django.urls import reverse

from games.tests.factories import GameFactory, GameRecipeFactory
from games.tests.views.game.recipes.detail._recipe_characters_fixtures import (
    RecipeCharactersViewFixtures,
)


@pytest.mark.django_db
class TestGameRecipeCharactersView(RecipeCharactersViewFixtures):
    """Tests for GET /games/<slug>/recipes/<id>/characters.json."""

    def setup_method(self):
        """Set up a recipe known by PCs and NPCs."""
        self.setup_recipe_characters()

    def _url(self, recipe_id=None, query=''):
        """Return the recipe characters URL (defaults to the fixture recipe)."""
        recipe_id = recipe_id if recipe_id is not None else self.recipe.id
        return f'/games/test-game/recipes/{recipe_id}/characters.json{query}'

    def _names(self, client, query=''):
        """Return the listed character names, in order."""
        response = self.get(client, self._url(query=query))
        return [entry['name'] for entry in json.loads(response.content)]

    def test_lists_pcs_and_npcs_ordered_by_name(self, client):
        """Test that PCs and NPCs are listed together, ordered by name."""
        assert self._names(client) == ['Aragorn', 'Gandalf', 'Zed']

    def test_excludes_hidden_links_and_hidden_or_incognito_npcs(self, client):
        """Test that hidden links, hidden NPCs and incognito NPCs are excluded."""
        names = self._names(client)
        assert 'Boromir' not in names
        assert 'Sauron' not in names
        assert 'Strider' not in names

    def test_entries_use_character_id_and_type(self, client):
        """Test that entries expose the character id and type, without hidden."""
        data = json.loads(self.get(client, self._url()).content)
        entry = data[1]
        assert entry == {
            'id': self.gandalf.id, 'name': 'Gandalf', 'photo_path': None, 'type': 'npc',
        }
        assert data[0]['type'] == 'pc'

    def test_orders_same_name_by_id(self, client):
        """Test that characters sharing a name are ordered by id."""
        first = self._know('Aragorn', npc=True)
        data = json.loads(self.get(client, self._url()).content)
        assert [entry['id'] for entry in data[:2]] == [self.aragorn.id, first.id]

    def test_paginates(self, client):
        """Test that ?page= / ?per_page= paginate the results."""
        response = self.get(client, self._url(query='?page=2&per_page=2'))
        assert response['pages'] == '2'
        assert [entry['name'] for entry in json.loads(response.content)] == ['Zed']

    def test_returns_404_for_hidden_recipe(self, client):
        """Test that a hidden recipe returns 404, even for the DM."""
        self.recipe.hidden = True
        self.recipe.save()
        assert self.get(client, self._url(), token=self.dm_token).status_code == 404

    def test_returns_404_for_unknown_recipe(self, client):
        """Test that an unknown recipe returns 404."""
        assert self.get(client, self._url(recipe_id=99999)).status_code == 404

    def test_returns_404_for_other_game_recipe(self, client):
        """Test that a recipe of another game returns 404."""
        other_recipe = GameRecipeFactory(game=GameFactory(game_slug='other-game'))
        assert self.get(client, self._url(recipe_id=other_recipe.id)).status_code == 404

    def test_does_not_set_skip_cache(self, client):
        """Test that the plain endpoint sets no X-Skip-Cache header."""
        assert 'X-Skip-Cache' not in self.get(client, self._url())

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-recipe-characters',
            kwargs={'game_slug': 'test-game', 'recipe_id': self.recipe.id},
        )
        assert self.get(client, url).status_code == 200
