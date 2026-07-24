import GameItemsController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemsController.js';

describe('GameItemsController', function() {
  describe('.getGameSlugFromItemsHash', function() {
    it('extracts the game slug from an items index hash', function() {
      expect(GameItemsController.getGameSlugFromItemsHash('#/games/demo/items')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GameItemsController.getGameSlugFromItemsHash('#/games/demo')).toBe('');
    });
  });
});
