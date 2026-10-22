"""End-to-end tests for the `@token_scopes` declarations of the common item views (issue #1635)."""

import pytest

from games.tests.factories import GameCommonItemFactory, GameRecipeFactory
from games.tests.views.games._entity_token_scopes_behavior import (
    EntityScopedTokenMixin,
    GamesBehavior,
    OtherCredentialsBehavior,
    OwnerIntersectionBehavior,
    PublicReadsBehavior,
    RestrictedReadsBehavior,
    WritesBehavior,
)

RECIPES_ALL_SCOPES = ['common_items:read', 'recipes:read']


class CommonItemScopedTokenMixin(EntityScopedTokenMixin):
    """Entity fixtures for the common item family, plus recipes producing the visible one."""

    family = 'common_items'
    permissions_name = 'game_common_item'
    factory = staticmethod(GameCommonItemFactory)
    create_payload = {'name': 'New', 'price': 5}

    def setup_method(self):
        """Set up the entity fixtures and a visible and a hidden recipe of the common item."""
        super().setup_method()
        GameRecipeFactory(game=self.game, game_common_item=self.entity, name='Forge')
        self.hidden_recipe = GameRecipeFactory(
            game=self.game, game_common_item=self.entity, name='Secret', hidden=True,
        )

    def _recipes_all_url(self):
        """Return the visible common item's recipes/all.json URL."""
        return self._entity_url('/recipes/all.json')


@pytest.mark.django_db
class TestCommonItemTokenScopesPublicReads(CommonItemScopedTokenMixin, PublicReadsBehavior):
    """Plain common item reads accept a token without any scope."""

    def test_recipes_needs_no_scope(self):
        """Test that common_items/<id>/recipes.json answers 200 for a token with no scopes."""
        response = self._get(self._entity_url('/recipes.json'), self.player, [])
        assert response.status_code == 200


@pytest.mark.django_db
class TestCommonItemTokenScopesRestrictedReads(
    CommonItemScopedTokenMixin, RestrictedReadsBehavior,
):
    """all.json and full.json need `common_items:read`."""


@pytest.mark.django_db
class TestCommonItemTokenScopesRecipesAll(CommonItemScopedTokenMixin):
    """common_items/<id>/recipes/all.json needs `common_items:read` and `recipes:read`."""

    def _recipes_all(self, scopes):
        """GET the visible common item's recipes/all.json as the DM with `scopes`."""
        return self._get(self._recipes_all_url(), self.dm, scopes)

    def test_with_both_scopes_is_allowed(self):
        """Test that recipes/all.json with both read scopes answers 200."""
        assert self._recipes_all(RECIPES_ALL_SCOPES).status_code == 200

    def test_with_both_scopes_includes_hidden_recipes(self):
        """Test that recipes/all.json with both read scopes lists the hidden recipe."""
        names = {recipe['name'] for recipe in self._recipes_all(RECIPES_ALL_SCOPES).json()}
        assert self.hidden_recipe.name in names

    def test_with_common_items_read_alone_is_refused(self):
        """Test that recipes/all.json with `common_items:read` alone gives `scope_missing`."""
        self._assert_refused(self._recipes_all(['common_items:read']), 'scope_missing')

    def test_with_recipes_read_alone_is_refused(self):
        """Test that recipes/all.json with `recipes:read` alone gives `scope_missing`."""
        self._assert_refused(self._recipes_all(['recipes:read']), 'scope_missing')

    def test_player_with_both_scopes_is_forbidden(self):
        """Test that a player with both read scopes still gets a role 403."""
        response = self._get(self._recipes_all_url(), self.player, RECIPES_ALL_SCOPES)
        self._assert_role_refused(response)


@pytest.mark.django_db
class TestCommonItemTokenScopesWrites(CommonItemScopedTokenMixin, WritesBehavior):
    """Common item writes need `common_items:write`."""


@pytest.mark.django_db
class TestCommonItemTokenScopesGames(CommonItemScopedTokenMixin, GamesBehavior):
    """A token limited to some games is only accepted on those games."""


@pytest.mark.django_db
class TestCommonItemTokenScopesOwnerIntersection(
    CommonItemScopedTokenMixin, OwnerIntersectionBehavior,
):
    """A token never grants more than its owner's role allows."""


@pytest.mark.django_db
class TestCommonItemTokenScopesOtherCredentials(
    CommonItemScopedTokenMixin, OtherCredentialsBehavior,
):
    """Session and legacy `Token` requests are unaffected by scope declarations."""
