"""Tests for POST /games/<slug>/recipes.json (issue #1446)."""

import json

import pytest

from games.models import GameRecipe
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.views.game.recipes.recipe_write_support import RecipeWriteSetupMixin

URL = '/games/test-game/recipes.json'
PLAIN_KEYS = {
    'id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output',
    'description', 'ingredients', 'checks',
}


@pytest.mark.django_db
class TestGameRecipesCreateRoles(RecipeWriteSetupMixin, TokenAuthRequestMixin):
    """Role matrix for POST /games/<slug>/recipes.json."""

    def setup_method(self):
        """Set up the game, items and role tokens."""
        self.setup_recipe_world()

    def _post(self, client, role=None):
        """POST a minimal valid recipe as `role` (anonymous when None)."""
        payload = {'name': 'Brew', 'game_common_item_id': self.item.id}
        token = self.tokens[role] if role else None
        return self.post(client, URL, payload, token=token)

    def test_anonymous_returns_401(self, client):
        """Test that an anonymous caller gets 401."""
        assert self._post(client).status_code == 401

    def test_non_member_returns_403(self, client):
        """Test that an authenticated non-member gets 403."""
        assert self._post(client, 'non_member').status_code == 403

    @pytest.mark.parametrize('role', ['player', 'staff', 'dm', 'superuser'])
    def test_allowed_roles_return_201(self, client, role):
        """Test that player, staff, dm and superuser can create a recipe."""
        assert self._post(client, role).status_code == 201

    @pytest.mark.parametrize('role', [None, 'non_member', 'player', 'dm'])
    def test_sets_skip_cache_on_every_status(self, client, role):
        """Test that 401/403/201 responses all carry X-Skip-Cache."""
        assert self._post(client, role)['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_on_400(self, client):
        """Test that a validation error response carries X-Skip-Cache."""
        response = self.post(client, URL, {}, token=self.tokens['player'])
        assert response.status_code == 400
        assert response['X-Skip-Cache'] == 'true'

    def test_unknown_game_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        url = '/games/nope/recipes.json'
        payload = {'name': 'Brew', 'game_common_item_id': self.item.id}
        assert self.post(client, url, payload, token=self.tokens['dm']).status_code == 404


@pytest.mark.django_db
class TestGameRecipesCreateFields(RecipeWriteSetupMixin, TokenAuthRequestMixin):
    """Field defaults, bounds and mass assignment for POST /games/<slug>/recipes.json."""

    def setup_method(self):
        """Set up the game, items and role tokens."""
        self.setup_recipe_world()

    def _post(self, client, role='player', **fields):
        """POST a valid recipe overridden with `fields` as `role`."""
        payload = {'name': 'Brew', 'game_common_item_id': self.item.id, **fields}
        return self.post(client, URL, payload, token=self.tokens[role])

    def test_applies_defaults(self, client):
        """Test that optional fields fall back to the model defaults."""
        data = json.loads(self._post(client).content)
        recipe = GameRecipe.objects.get(id=data['id'])
        assert recipe.game == self.game
        assert recipe.description == ''
        assert recipe.yield_quantity == 1
        assert recipe.crafting_time == ''
        assert recipe.crafting_cost == 0
        assert recipe.ingredients == ''
        assert recipe.checks == ''
        assert recipe.hidden is False

    def test_persists_all_fields(self, client):
        """Test that every allowlisted field is persisted."""
        response = self._post(
            client, 'dm', description='Stir.', yield_quantity=3, crafting_time='1 hour',
            crafting_cost=2147483647, ingredients='Herbs', checks='DC 15', hidden=True,
        )
        recipe = GameRecipe.objects.get(id=json.loads(response.content)['id'])
        assert recipe.yield_quantity == 3
        assert recipe.crafting_cost == 2147483647
        assert recipe.crafting_time == '1 hour'
        assert recipe.hidden is True

    def test_allows_duplicate_names(self, client):
        """Test that two recipes of the same game may share a name."""
        self._post(client)
        assert self._post(client).status_code == 201

    @pytest.mark.parametrize('fields', [
        {'name': ''},
        {'name': 'x' * 201},
        {'yield_quantity': 0},
        {'yield_quantity': 2147483648},
        {'crafting_cost': -1},
        {'crafting_cost': 2147483648},
        {'crafting_time': 'x' * 201},
    ])
    def test_out_of_bounds_returns_400(self, client, fields):
        """Test that out-of-bound values return 400."""
        assert self._post(client, **fields).status_code == 400

    def test_missing_name_returns_400(self, client):
        """Test that a missing name returns 400."""
        payload = {'game_common_item_id': self.item.id}
        response = self.post(client, URL, payload, token=self.tokens['player'])
        assert response.status_code == 400

    def test_missing_output_returns_400(self, client):
        """Test that a missing game_common_item_id returns 400."""
        response = self.post(client, URL, {'name': 'Brew'}, token=self.tokens['player'])
        assert response.status_code == 400
        errors = json.loads(response.content)['errors']
        assert errors == {'game_common_item_id': ['required']}

    @pytest.mark.parametrize('value', ['abc', True, 1.5, [1], 10 ** 20])
    def test_invalid_output_id_returns_400(self, client, value):
        """Test that a non-integer or huge game_common_item_id returns 400."""
        assert self._post(client, game_common_item_id=value).status_code == 400

    def test_ignores_mass_assigned_game_and_id(self, client):
        """Test that `game` and `id` in the body have no effect."""
        response = self._post(client, id=999999, game=self.other_game.id)
        recipe = GameRecipe.objects.get(id=json.loads(response.content)['id'])
        assert recipe.id != 999999
        assert recipe.game == self.game


@pytest.mark.django_db
class TestGameRecipesCreateVisibility(RecipeWriteSetupMixin, TokenAuthRequestMixin):
    """Output validation (E1) and response shape (E2) for POST recipes.json."""

    def setup_method(self):
        """Set up the game, items and role tokens."""
        self.setup_recipe_world()

    def _post(self, client, role, item_id, **fields):
        """POST a recipe whose output is `item_id` as `role`."""
        payload = {'name': 'Brew', 'game_common_item_id': item_id, **fields}
        return self.post(client, URL, payload, token=self.tokens[role])

    def test_regular_tier_rejects_unknown_cross_game_and_hidden_identically(self, client):
        """Test that unknown, cross-game and hidden ids return the same 400 body."""
        responses = [
            self._post(client, 'player', item_id)
            for item_id in (self.item.id + 1000, self.other_item.id, self.hidden_item.id)
        ]
        assert {response.status_code for response in responses} == {400}
        assert len({response.content for response in responses}) == 1
        assert json.loads(responses[0].content) == {
            'errors': {'game_common_item_id': ['does_not_exist']},
        }

    def test_dm_rejects_unknown_and_cross_game(self, client):
        """Test that GameEdit callers still cannot use unknown or other-game items."""
        assert self._post(client, 'dm', self.item.id + 1000).status_code == 400
        assert self._post(client, 'dm', self.other_item.id).status_code == 400

    def test_dm_can_use_hidden_output(self, client):
        """Test that a GameEdit caller may use a hidden output item."""
        response = self._post(client, 'dm', self.hidden_item.id)
        assert response.status_code == 201
        assert json.loads(response.content)['output']['id'] == self.hidden_item.id

    def test_regular_tier_gets_plain_shape(self, client):
        """Test that a regular-tier caller gets the plain detail shape."""
        data = json.loads(self._post(client, 'staff', self.item.id).content)
        assert set(data.keys()) == PLAIN_KEYS
        assert data['output']['id'] == self.item.id

    def test_dm_gets_full_shape(self, client):
        """Test that a GameEdit caller gets the full shape with `hidden`."""
        data = json.loads(self._post(client, 'dm', self.item.id).content)
        assert set(data.keys()) == PLAIN_KEYS | {'hidden'}
        assert data['hidden'] is False

    def test_regular_tier_hidden_recipe_returns_plain_shape(self, client):
        """Test that a regular-tier hidden create returns 201 with the plain shape."""
        response = self._post(client, 'player', self.item.id, hidden=True)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert set(data.keys()) == PLAIN_KEYS
        assert GameRecipe.objects.get(id=data['id']).hidden is True

    def test_regular_tier_hidden_recipe_then_404s_on_plain_read(self, client):
        """Test that a hidden recipe created on the regular tier 404s on the plain GET."""
        data = json.loads(self._post(client, 'player', self.item.id, hidden=True).content)
        url = f'/games/test-game/recipes/{data["id"]}.json'
        assert self.get(client, url).status_code == 404
