import GameRecipesController
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipesController.js';

describe('GameRecipesController', function() {
  describe('.getGameSlugFromRecipesHash', function() {
    it('extracts the game slug from a recipes index hash', function() {
      expect(GameRecipesController.getGameSlugFromRecipesHash('#/games/demo/recipes')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GameRecipesController.getGameSlugFromRecipesHash('#/games/demo')).toBe('');
    });
  });

  describe('.buildFilterQueryHash', function() {
    it('resets to page 1 and applies the category', function() {
      expect(GameRecipesController.buildFilterQueryHash('#/games/demo/recipes', { category: 'potion' }))
        .toBe('#/games/demo/recipes?page=1&category=potion');
    });

    it('resets to page 1 with no filters for "all"', function() {
      expect(GameRecipesController.buildFilterQueryHash('#/games/demo/recipes', {}))
        .toBe('#/games/demo/recipes?page=1');
    });
  });
});
