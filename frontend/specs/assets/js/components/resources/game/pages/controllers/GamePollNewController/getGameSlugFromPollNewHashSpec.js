import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';

describe('GamePollNewController', function() {
  describe('.getGameSlugFromPollNewHash', function() {
    it('extracts the game slug from a poll creation hash', function() {
      expect(GamePollNewController.getGameSlugFromPollNewHash('#/games/demo/polls/new')).toBe('demo');
    });

    it('returns an empty string for a non-matching hash', function() {
      expect(GamePollNewController.getGameSlugFromPollNewHash('#/games/demo')).toBe('');
    });
  });
});
