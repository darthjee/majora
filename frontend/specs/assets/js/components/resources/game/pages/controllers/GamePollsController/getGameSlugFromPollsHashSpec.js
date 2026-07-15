import GamePollsController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollsController.js';

describe('GamePollsController', function() {
  describe('.getGameSlugFromPollsHash', function() {
    it('extracts the game slug from a polls index hash', function() {
      expect(GamePollsController.getGameSlugFromPollsHash('#/games/demo/polls')).toBe('demo');
    });

    it('returns an empty string for a non-matching hash', function() {
      expect(GamePollsController.getGameSlugFromPollsHash('#/games/demo')).toBe('');
    });
  });
});
