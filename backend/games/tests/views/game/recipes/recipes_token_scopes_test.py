"""End-to-end tests for the `@token_scopes` declarations of the recipe views (issue #1635)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
    UserFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

READ_SCOPES = ['recipes:read', 'common_items:read']
WRITE_SCOPES = ['recipes:write', 'common_items:read']
CHARACTERS_ALL_SCOPES = ['recipes:read', 'pcs:read', 'npcs:read']
ALL_RECIPE_SCOPES = ['recipes:read', 'recipes:write', 'common_items:read']


class RecipeScopedTokenMixin(ScopedTokenMixin):
    """Fixtures: a game with a DM, a player and an outsider, recipes and a hidden NPC crafter."""

    def setup_method(self):
        """Set up the game, its members, the output item, the recipes and a crafter."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.output = GameCommonItemFactory(game=self.game, name='Potion')
        self.recipe = GameRecipeFactory(game=self.game, game_common_item=self.output, name='Brew')
        self.hidden_recipe = GameRecipeFactory(
            game=self.game, game_common_item=self.output, name='Secret', hidden=True,
        )
        self.crafter = CharacterFactory(name='Hermit', game=self.game, npc=True, hidden=True)
        CharacterRecipeFactory(character=self.crafter, game_recipe=self.recipe)

    def _recipe_url(self, suffix='.json', recipe=None):
        """Return the URL of `recipe` (default: the visible one) followed by `suffix`."""
        recipe = recipe or self.recipe
        return f'/games/test-game/recipes/{recipe.id}{suffix}'

    def _characters_all_url(self):
        """Return the visible recipe's characters/all.json URL."""
        return self._recipe_url('/characters/all.json')

    def _create_payload(self):
        """Return a valid recipe creation payload."""
        return {'name': 'New', 'game_common_item_id': self.output.id}


@pytest.mark.django_db
class TestRecipeTokenScopesPublicReads(RecipeScopedTokenMixin):
    """Plain recipe reads accept a token without any scope."""

    def test_recipes_list_needs_no_scope(self):
        """Test that recipes.json answers 200 for a token with no scopes."""
        response = self._get('/games/test-game/recipes.json', self.player, [])
        assert response.status_code == 200

    def test_recipe_detail_needs_no_scope(self):
        """Test that recipes/<id>.json answers 200 for a token with no scopes."""
        assert self._get(self._recipe_url(), self.player, []).status_code == 200

    def test_recipe_characters_needs_no_scope(self):
        """Test that recipes/<id>/characters.json answers 200 for a token with no scopes."""
        response = self._get(self._recipe_url('/characters.json'), self.player, [])
        assert response.status_code == 200

    def test_recipe_permissions_needs_no_scope(self):
        """Test that permissions/game_recipe.json answers 200 for a token with no scopes."""
        response = self._get('/permissions/game_recipe.json', self.player, [])
        assert response.status_code == 200


@pytest.mark.django_db
class TestRecipeTokenScopesRestrictedReads(RecipeScopedTokenMixin):
    """recipes/all.json and full.json need `recipes:read` and `common_items:read`."""

    def _all(self, scopes):
        """GET recipes/all.json as the DM with `scopes`."""
        return self._get('/games/test-game/recipes/all.json', self.dm, scopes)

    def _full(self, scopes):
        """GET the hidden recipe's full.json as the DM with `scopes`."""
        return self._get(self._recipe_url('/full.json', self.hidden_recipe), self.dm, scopes)

    def test_all_with_recipes_read_alone_is_refused(self):
        """Test that recipes/all.json with `recipes:read` alone gives `scope_missing`."""
        self._assert_refused(self._all(['recipes:read']), 'scope_missing')

    def test_all_with_both_read_scopes_is_allowed(self):
        """Test that recipes/all.json with both read scopes answers 200."""
        assert self._all(READ_SCOPES).status_code == 200

    def test_full_with_recipes_read_alone_is_refused(self):
        """Test that recipes/<id>/full.json with `recipes:read` alone gives `scope_missing`."""
        self._assert_refused(self._full(['recipes:read']), 'scope_missing')

    def test_full_with_both_read_scopes_is_allowed(self):
        """Test that recipes/<id>/full.json of a hidden recipe with both scopes answers 200."""
        assert self._full(READ_SCOPES).status_code == 200


@pytest.mark.django_db
class TestRecipeTokenScopesCharactersAll(RecipeScopedTokenMixin):
    """characters/all.json needs `recipes:read`, `pcs:read` and `npcs:read`."""

    def _characters_all_without(self, scope):
        """GET characters/all.json as the DM with every needed scope except `scope`."""
        scopes = [name for name in CHARACTERS_ALL_SCOPES if name != scope]
        return self._get(self._characters_all_url(), self.dm, scopes)

    def test_with_every_scope_is_allowed(self):
        """Test that characters/all.json with the three read scopes answers 200."""
        response = self._get(self._characters_all_url(), self.dm, CHARACTERS_ALL_SCOPES)
        assert response.status_code == 200

    def test_with_every_scope_lists_hidden_npcs(self):
        """Test that characters/all.json with the three read scopes lists the hidden NPC."""
        response = self._get(self._characters_all_url(), self.dm, CHARACTERS_ALL_SCOPES)
        assert self.crafter.name in {character['name'] for character in response.json()}

    def test_without_recipes_read_is_refused(self):
        """Test that characters/all.json without `recipes:read` gives `scope_missing`."""
        self._assert_refused(self._characters_all_without('recipes:read'), 'scope_missing')

    def test_without_pcs_read_is_refused(self):
        """Test that characters/all.json without `pcs:read` gives `scope_missing`."""
        self._assert_refused(self._characters_all_without('pcs:read'), 'scope_missing')

    def test_without_npcs_read_is_refused(self):
        """Test that characters/all.json without `npcs:read` gives `scope_missing`."""
        self._assert_refused(self._characters_all_without('npcs:read'), 'scope_missing')


@pytest.mark.django_db
class TestRecipeTokenScopesWrites(RecipeScopedTokenMixin):
    """Recipe writes need `recipes:write` and `common_items:read`."""

    def _create(self, scopes, user=None):
        """POST a new recipe as `user` (default: the DM) with `scopes`."""
        url = '/games/test-game/recipes.json'
        return self._post(url, self._create_payload(), user or self.dm, scopes)

    def _update(self, scopes):
        """PATCH the visible recipe as the DM with `scopes`."""
        return self._patch(self._recipe_url(), {'name': 'Renamed'}, self.dm, scopes)

    def test_create_with_recipes_write_alone_is_refused(self):
        """Test that recipes.json POST with `recipes:write` alone gives `scope_missing`."""
        self._assert_refused(self._create(['recipes:write']), 'scope_missing')

    def test_create_with_write_scopes_succeeds(self):
        """Test that recipes.json POST with `recipes:write` and `common_items:read` gives 201."""
        assert self._create(WRITE_SCOPES).status_code == 201

    def test_player_create_with_write_scopes_succeeds(self):
        """Test that a player, a regular-tier recipe writer, can create with the scopes."""
        assert self._create(WRITE_SCOPES, self.player).status_code == 201

    def test_update_with_recipes_write_alone_is_refused(self):
        """Test that recipes/<id>.json PATCH with `recipes:write` alone gives `scope_missing`."""
        self._assert_refused(self._update(['recipes:write']), 'scope_missing')

    def test_update_with_write_scopes_succeeds(self):
        """Test that recipes/<id>.json PATCH with both write scopes answers 200."""
        assert self._update(WRITE_SCOPES).status_code == 200


@pytest.mark.django_db
class TestRecipeTokenScopesGames(RecipeScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def _all_with_games(self, games):
        """GET recipes/all.json as the DM with the read scopes, limited to `games`."""
        url = '/games/test-game/recipes/all.json'
        return self._get(url, self.dm, READ_SCOPES, games=games)

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        self._assert_refused(self._all_with_games([self.other_game]), 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the recipe's game answers 200."""
        assert self._all_with_games([self.game]).status_code == 200


@pytest.mark.django_db
class TestRecipeTokenScopesOwnerIntersection(RecipeScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_player_all_is_forbidden(self):
        """Test that a player with every recipe scope still gets a role 403 on recipes/all."""
        url = '/games/test-game/recipes/all.json'
        self._assert_role_refused(self._get(url, self.player, ALL_RECIPE_SCOPES))

    def test_player_characters_all_is_forbidden(self):
        """Test that a player with the three read scopes still gets a role 403."""
        response = self._get(self._characters_all_url(), self.player, CHARACTERS_ALL_SCOPES)
        self._assert_role_refused(response)

    def test_outsider_update_is_forbidden(self):
        """Test that a non-member with every recipe scope still gets a role 403 on PATCH."""
        response = self._patch(
            self._recipe_url(), {'name': 'Renamed'}, self.outsider, ALL_RECIPE_SCOPES,
        )
        self._assert_role_refused(response)


@pytest.mark.django_db
class TestRecipeTokenScopesOtherCredentials(RecipeScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_all(self):
        """Test that the DM's session still reads recipes/all.json."""
        self._log_in(self.dm)
        assert self.client.get('/games/test-game/recipes/all.json').status_code == 200

    def test_legacy_token_dm_creates_recipe(self):
        """Test that the DM's legacy Token still creates a recipe."""
        token = Token.objects.create(user=self.dm)
        response = self.client.post(
            '/games/test-game/recipes.json', self._create_payload(), format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
