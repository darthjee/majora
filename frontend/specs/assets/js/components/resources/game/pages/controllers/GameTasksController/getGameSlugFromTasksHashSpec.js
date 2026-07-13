import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';

describe('GameTasksController', function() {
  describe('.getGameSlugFromTasksHash', function() {
    it('extracts game slug from a tasks hash', function() {
      expect(GameTasksController.getGameSlugFromTasksHash('#/games/demo/tasks')).toBe('demo');
    });

    it('returns empty string when the hash does not match the tasks route', function() {
      expect(GameTasksController.getGameSlugFromTasksHash('#/games/demo/sessions')).toBe('');
    });
  });
});
