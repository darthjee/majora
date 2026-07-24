import GameItemNewController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemNewController.js';

describe('GameItemNewController', function() {
  describe('.getGameSlugFromItemNewHash', function() {
    it('extracts the game slug from an item new hash', function() {
      expect(GameItemNewController.getGameSlugFromItemNewHash('#/games/demo/items/new')).toBe('demo');
    });

    it('returns an empty string when the hash does not match the new route', function() {
      expect(GameItemNewController.getGameSlugFromItemNewHash('#/games/demo/items')).toBe('');
    });
  });
});
