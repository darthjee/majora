import GameCommonItemNewController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemNewController.js';

describe('GameCommonItemNewController', function() {
  describe('.getGameSlugFromCommonItemNewHash', function() {
    it('extracts the game slug from a common item new hash', function() {
      expect(GameCommonItemNewController.getGameSlugFromCommonItemNewHash('#/games/demo/common_items/new'))
        .toBe('demo');
    });

    it('returns an empty string when the hash does not match the new route', function() {
      expect(GameCommonItemNewController.getGameSlugFromCommonItemNewHash('#/games/demo/common_items')).toBe('');
    });
  });
});
