import GamePollsController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollsController.js';

describe('GamePollsController', function() {
  describe('.buildFilterQueryHash', function() {
    it('resets pagination to page 1 when no filters are active', function() {
      expect(GamePollsController.buildFilterQueryHash('#/games/demo/polls', {}))
        .toBe('#/games/demo/polls?page=1');
    });

    it('includes the active status filter alongside the reset page', function() {
      expect(GamePollsController.buildFilterQueryHash('#/games/demo/polls', { status: 'open' }))
        .toBe('#/games/demo/polls?page=1&status=open');
    });
  });
});
