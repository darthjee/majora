"""Tests for PATCH /games/<slug>/recipes/<id>.json (issue #1446)."""

import json

import pytest

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameRecipeFactory
from games.tests.views.game.recipes.recipe_write_support import RecipeWriteSetupMixin

PLAIN_KEYS = {
    'id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output',
    'description', 'ingredients', 'checks',
}


def _url(recipe_id, game_slug='test-game'):
    """Return the recipe detail URL for `recipe_id`."""
    return f'/games/{game_slug}/recipes/{recipe_id}.json'


@pytest.mark.django_db
class TestGameRecipePatchRoles(RecipeWriteSetupMixin, TokenAuthRequestMixin):
    """Role matrix and lookup rules for PATCH /games/<slug>/recipes/<id>.json."""

    def setup_method(self):
        """Set up the game, items, role tokens and a visible and a hidden recipe."""
        self.setup_recipe_world()
        self.recipe = GameRecipeFactory(game=self.game, game_common_item=self.item)
        self.hidden_recipe = GameRecipeFactory(
            game=self.game, game_common_item=self.item, hidden=True,
        )

    def _patch(self, client, role=None, recipe=None, payload=None):
        """PATCH `recipe` (default: the visible one) as `role` (anonymous when None)."""
        recipe = recipe or self.recipe
        token = self.tokens[role] if role else None
        return self.patch(client, _url(recipe.id), payload or {'name': 'New'}, token=token)

    def test_anonymous_returns_401(self, client):
        """Test that an anonymous caller gets 401."""
        assert self._patch(client).status_code == 401

    def test_non_member_returns_403(self, client):
        """Test that an authenticated non-member gets 403."""
        assert self._patch(client, 'non_member').status_code == 403

    @pytest.mark.parametrize('role', ['player', 'staff', 'dm', 'superuser'])
    def test_allowed_roles_return_200(self, client, role):
        """Test that player, staff, dm and superuser can update a recipe."""
        assert self._patch(client, role).status_code == 200

    @pytest.mark.parametrize('role', ['player', 'staff'])
    def test_hidden_recipe_returns_404_on_regular_tier(self, client, role):
        """Test that a regular-tier caller gets 404 on a hidden recipe (E3)."""
        assert self._patch(client, role, self.hidden_recipe).status_code == 404

    @pytest.mark.parametrize('role', ['dm', 'superuser'])
    def test_hidden_recipe_is_editable_by_game_edit(self, client, role):
        """Test that GameEdit callers can PATCH a hidden recipe."""
        assert self._patch(client, role, self.hidden_recipe).status_code == 200

    def test_unknown_recipe_returns_404(self, client):
        """Test that an unknown recipe id returns 404."""
        response = self.patch(
            client, _url(self.recipe.id + 1000), {'name': 'New'}, token=self.tokens['dm'],
        )
        assert response.status_code == 404

    def test_other_game_recipe_returns_404(self, client):
        """Test that a recipe from another game returns 404."""
        recipe = GameRecipeFactory(game=self.other_game, game_common_item=self.other_item)
        assert self._patch(client, 'dm', recipe).status_code == 404

    @pytest.mark.parametrize('role', [None, 'non_member', 'player', 'dm'])
    def test_sets_skip_cache(self, client, role):
        """Test that 401/403/200 responses carry X-Skip-Cache."""
        assert self._patch(client, role)['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_on_404(self, client):
        """Test that the hidden-recipe 404 carries X-Skip-Cache."""
        assert self._patch(client, 'player', self.hidden_recipe)['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_on_400(self, client):
        """Test that a validation error carries X-Skip-Cache."""
        response = self._patch(client, 'player', payload={'yield_quantity': 0})
        assert response.status_code == 400
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameRecipePatchFields(RecipeWriteSetupMixin, TokenAuthRequestMixin):
    """Field updates, output validation and response shape for PATCH recipes/<id>.json."""

    def setup_method(self):
        """Set up the game, items, role tokens and a recipe."""
        self.setup_recipe_world()
        self.recipe = GameRecipeFactory(
            game=self.game, game_common_item=self.item, name='Old', crafting_cost=5,
            ingredients='Herbs',
        )

    def _patch(self, client, role, payload):
        """PATCH the recipe with `payload` as `role`."""
        return self.patch(client, _url(self.recipe.id), payload, token=self.tokens[role])

    def test_partial_update_changes_only_given_fields(self, client):
        """Test that a partial update leaves other fields untouched."""
        assert self._patch(client, 'player', {'name': 'New'}).status_code == 200
        self.recipe.refresh_from_db()
        assert self.recipe.name == 'New'
        assert self.recipe.crafting_cost == 5
        assert self.recipe.ingredients == 'Herbs'

    def test_regular_tier_rejects_unknown_cross_game_and_hidden_identically(self, client):
        """Test that unknown, cross-game and hidden ids return the same 400 body."""
        responses = [
            self._patch(client, 'player', {'game_common_item_id': item_id})
            for item_id in (self.item.id + 1000, self.other_item.id, self.hidden_item.id)
        ]
        assert {response.status_code for response in responses} == {400}
        assert len({response.content for response in responses}) == 1

    def test_dm_rejects_cross_game_output(self, client):
        """Test that GameEdit callers cannot point at another game's item."""
        response = self._patch(client, 'dm', {'game_common_item_id': self.other_item.id})
        assert response.status_code == 400

    def test_dm_can_use_hidden_output(self, client):
        """Test that a GameEdit caller may switch to a hidden output item."""
        response = self._patch(client, 'dm', {'game_common_item_id': self.hidden_item.id})
        assert response.status_code == 200
        self.recipe.refresh_from_db()
        assert self.recipe.game_common_item == self.hidden_item

    def test_invalid_output_id_returns_400(self, client):
        """Test that a non-integer game_common_item_id returns 400."""
        response = self._patch(client, 'player', {'game_common_item_id': 'abc'})
        assert response.status_code == 400

    def test_regular_tier_gets_plain_shape(self, client):
        """Test that a regular-tier caller gets the plain detail shape."""
        data = json.loads(self._patch(client, 'player', {'name': 'New'}).content)
        assert set(data.keys()) == PLAIN_KEYS

    def test_regular_tier_hiding_returns_plain_shape_then_404s(self, client):
        """Test that hiding on the regular tier returns 200 plain, then later PATCHes 404."""
        response = self._patch(client, 'player', {'hidden': True})
        assert response.status_code == 200
        assert set(json.loads(response.content).keys()) == PLAIN_KEYS
        assert self._patch(client, 'player', {'name': 'x'}).status_code == 404

    def test_dm_gets_full_shape(self, client):
        """Test that a GameEdit caller gets the full shape with `hidden`."""
        data = json.loads(self._patch(client, 'dm', {'name': 'New'}).content)
        assert set(data.keys()) == PLAIN_KEYS | {'hidden'}

    def test_ignores_mass_assigned_game_and_id(self, client):
        """Test that `game` and `id` in the body have no effect."""
        original_id = self.recipe.id
        self._patch(client, 'dm', {'id': 999999, 'game': self.other_game.id})
        self.recipe.refresh_from_db()
        assert self.recipe.id == original_id
        assert self.recipe.game == self.game
