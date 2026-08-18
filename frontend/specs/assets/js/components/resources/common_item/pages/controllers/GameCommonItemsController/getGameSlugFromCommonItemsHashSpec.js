import GameCommonItemsController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemsController.js';

describe('GameCommonItemsController', function() {
  describe('.getGameSlugFromCommonItemsHash', function() {
    it('extracts the game slug from a common items index hash', function() {
      expect(GameCommonItemsController.getGameSlugFromCommonItemsHash('#/games/demo/common_items')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GameCommonItemsController.getGameSlugFromCommonItemsHash('#/games/demo')).toBe('');
    });
  });
});
