import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';

describe('GamePollController', function() {
  describe('.getPollParamsFromHash', function() {
    it('extracts the game slug and poll id from a poll detail hash', function() {
      expect(GamePollController.getPollParamsFromHash('#/games/demo/polls/7'))
        .toEqual({ game_slug: 'demo', id: '7' });
    });

    it('returns empty strings for a non-matching hash', function() {
      expect(GamePollController.getPollParamsFromHash('#/games/demo'))
        .toEqual({ game_slug: '', id: '' });
    });
  });
});
