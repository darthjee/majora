import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GameTasksController', function() {
  let taskClient;
  let setTasks;
  let tasks;

  beforeEach(function() {
    taskClient = jasmine.createSpyObj('taskClient', ['fetchTasks', 'createTask', 'updateTask']);
    setTasks = jasmine.createSpy('setTasks');
    tasks = [{
      id: 1, short_description: 'Old', long_description: 'Old details', completed: false, session: null,
    }];
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#handleSaveEdit', function() {
    it('updates the matching task in local state on success', async function() {
      const updated = {
        id: 1, short_description: 'New', long_description: 'New details', completed: false, session: null,
      };
      taskClient.updateTask.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updated),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(taskClient.updateTask).toHaveBeenCalledWith('demo', 1, null, {
        short_description: 'New',
        long_description: 'New details',
      });
      expect(setTasks).toHaveBeenCalledWith([updated]);
      expect(result).toEqual(updated);
    });

    it('does not update local state and returns null when the response is not ok', async function() {
      taskClient.updateTask.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null when the request throws', async function() {
      taskClient.updateTask.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      const result = await controller.handleSaveEdit(
        'demo', tasks[0], { shortDescription: 'New', longDescription: 'New details' }, tasks, setTasks,
      );

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
