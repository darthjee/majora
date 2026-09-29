"""Tests for the recipe → characters all view (GameEdit; includes everything)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game.recipes.detail._recipe_characters_fixtures import (
    RecipeCharactersViewFixtures,
)


@pytest.mark.django_db
class TestGameRecipeCharactersAllView(RecipeCharactersViewFixtures):
    """Tests for GET /games/<slug>/recipes/<id>/characters/all.json."""

    def setup_method(self):
        """Set up a recipe known by PCs and NPCs."""
        self.setup_recipe_characters()

    def _url(self, recipe_id=None):
        """Return the recipe characters all URL (defaults to the fixture recipe)."""
        recipe_id = recipe_id if recipe_id is not None else self.recipe.id
        return f'/games/test-game/recipes/{recipe_id}/characters/all.json'

    def _data(self, client):
        """Return the DM's parsed response."""
        return json.loads(self.get(client, self._url(), token=self.dm_token).content)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        assert self.get(client, self._url(), token=self.player_token).status_code == 403

    def test_includes_everything_ordered_by_name(self, client):
        """Test that hidden links and hidden/incognito NPCs are included, ordered by name."""
        names = [entry['name'] for entry in self._data(client)]
        assert names == ['Aragorn', 'Boromir', 'Gandalf', 'Sauron', 'Strider', 'Zed']

    def test_entries_carry_link_hidden_flag(self, client):
        """Test that each entry carries CharacterRecipe.hidden."""
        by_name = {entry['name']: entry['hidden'] for entry in self._data(client)}
        assert by_name['Boromir'] is True
        assert by_name['Sauron'] is False

    def test_works_for_hidden_recipe(self, client):
        """Test that a hidden recipe still lists its characters."""
        self.recipe.hidden = True
        self.recipe.save()
        assert len(self._data(client)) == 6

    def test_returns_404_for_unknown_recipe(self, client):
        """Test that an unknown recipe returns 404."""
        response = self.get(client, self._url(recipe_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        assert self.get(client, self._url(), token=self.dm_token)['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-recipe-characters-all',
            kwargs={'game_slug': 'test-game', 'recipe_id': self.recipe.id},
        )
        assert self.get(client, url, token=self.dm_token).status_code == 200
