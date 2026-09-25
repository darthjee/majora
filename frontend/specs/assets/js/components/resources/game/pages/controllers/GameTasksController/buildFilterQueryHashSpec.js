import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';

describe('GameTasksController', function() {
  describe('.buildFilterQueryHash', function() {
    it('resets pagination to page 1 when no filters are active', function() {
      expect(GameTasksController.buildFilterQueryHash('#/games/demo/tasks', {}))
        .toBe('#/games/demo/tasks?page=1');
    });

    it('includes the category and completed filters alongside the reset page', function() {
      expect(GameTasksController.buildFilterQueryHash('#/games/demo/tasks', { category: 'painting', completed: 'false' }))
        .toBe('#/games/demo/tasks?page=1&category=painting&completed=false');
    });
  });
});
