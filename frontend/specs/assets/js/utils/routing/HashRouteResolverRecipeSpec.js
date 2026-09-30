import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver (game recipe routes, issue #1449)', function() {
  const resolve = (hash) => new HashRouteResolver(() => hash).getPage();

  it('resolves /games/:game_slug/recipes to gameRecipes, not game', function() {
    expect(resolve('#/games/campaign/recipes')).toBe('gameRecipes');
  });

  it('resolves /games/:game_slug/recipes/:id to gameRecipe', function() {
    expect(resolve('#/games/campaign/recipes/5')).toBe('gameRecipe');
  });

  it('resolves /games/:game_slug/recipes/new to gameRecipeNew, not gameRecipe', function() {
    expect(resolve('#/games/campaign/recipes/new')).toBe('gameRecipeNew');
  });

  it('resolves /games/:game_slug/recipes/:id/edit to gameRecipeEdit, not gameRecipe', function() {
    expect(resolve('#/games/campaign/recipes/5/edit')).toBe('gameRecipeEdit');
  });
});
