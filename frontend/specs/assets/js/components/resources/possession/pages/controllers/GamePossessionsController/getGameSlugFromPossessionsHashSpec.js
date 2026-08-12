import GamePossessionsController
  from '../../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionsController.js';

describe('GamePossessionsController', function() {
  describe('.getGameSlugFromPossessionsHash', function() {
    it('extracts the game slug from a possessions index hash', function() {
      expect(GamePossessionsController.getGameSlugFromPossessionsHash('#/games/demo/possessions')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GamePossessionsController.getGameSlugFromPossessionsHash('#/games/demo')).toBe('');
    });
  });
});
