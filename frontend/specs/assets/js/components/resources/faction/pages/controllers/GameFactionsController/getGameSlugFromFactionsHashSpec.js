import GameFactionsController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/controllers/GameFactionsController.js';

describe('GameFactionsController', function() {
  describe('.getGameSlugFromFactionsHash', function() {
    it('extracts the game slug from a factions index hash', function() {
      expect(GameFactionsController.getGameSlugFromFactionsHash('#/games/demo/factions')).toBe('demo');
    });

    it('defaults to an empty string for a non-matching hash', function() {
      expect(GameFactionsController.getGameSlugFromFactionsHash('#/games/demo')).toBe('');
    });
  });
});
