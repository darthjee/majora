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
    tasks = [{
      id: 1, short_description: 'Old', long_description: 'Old details', completed: false, session: null,
    }];
    mutateSpy = spyOn(RequestStore, 'mutate');
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#handleSaveEdit', function() {
    it('updates the matching task in local state on success', async function() {
      const updated = {
        id: 1, short_description: 'New', long_description: 'New details', completed: false, session: null,
      };
      mutateSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updated),
      }));

      const controller = new GameTasksController(null, null, null, null);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'GameTasksController',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 1 },
        body: {
          short_description: 'New',
          long_description: 'New details',
        },
      });
      expect(setTasks).toHaveBeenCalledWith([updated]);
      expect(result).toEqual(updated);
    });

    it('does not update local state and returns null when the response is not ok', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GameTasksController(null, null, null, null);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null when the request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTasksController(null, null, null, null);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
