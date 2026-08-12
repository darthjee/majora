import GamePossessionNewController
  from '../../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionNewController.js';

describe('GamePossessionNewController', function() {
  describe('.getGameSlugFromPossessionNewHash', function() {
    it('extracts the game slug from a possession new hash', function() {
      expect(GamePossessionNewController.getGameSlugFromPossessionNewHash('#/games/demo/possessions/new')).toBe('demo');
    });

    it('returns an empty string when the hash does not match the new route', function() {
      expect(GamePossessionNewController.getGameSlugFromPossessionNewHash('#/games/demo/possessions')).toBe('');
    });
  });
});
