import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameTasksController', function() {
  let setTasks;
  let tasks;
  let mutateSpy;

  beforeEach(function() {
    setTasks = jasmine.createSpy('setTasks');
    tasks = [
      {
        id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
      },
      {
        id: 2, short_description: 'Buy snacks', long_description: '', completed: false, session: null,
      },
    ];
    mutateSpy = spyOn(RequestStore, 'mutate');
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#handleToggleCompleted', function() {
    it('optimistically toggles and applies the server response on success', async function() {
      const updated = { ...tasks[0], completed: true };
      mutateSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updated),
      }));

      const controller = new GameTasksController(null, null, null, null);
      await controller.handleToggleCompleted('demo', tasks[0], tasks, setTasks);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'GameTasksController',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 1 },
        body: { completed: true },
      });
      expect(setTasks).toHaveBeenCalledWith([{ ...tasks[0], completed: true }, tasks[1]]);
      expect(setTasks).toHaveBeenCalledWith([updated, tasks[1]]);
    });

    it('rolls back to the original tasks when the update response is not ok', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GameTasksController(null, null, null, null);
      await controller.handleToggleCompleted('demo', tasks[0], tasks, setTasks);

      expect(setTasks).toHaveBeenCalledWith(tasks);
    });

    it('rolls back to the original tasks when the update request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTasksController(null, null, null, null);
      await controller.handleToggleCompleted('demo', tasks[0], tasks, setTasks);

      expect(setTasks).toHaveBeenCalledWith(tasks);
    });
  });
});
