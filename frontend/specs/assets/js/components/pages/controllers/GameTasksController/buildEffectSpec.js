import GameTasksController
  from '../../../../../../../assets/js/components/pages/controllers/GameTasksController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameTasksController', function() {
  let setTasks;
  let setPagination;
  let setLoading;
  let setError;
  let taskClient;
  let fakeWindow;

  beforeEach(function() {
    setTasks = jasmine.createSpy('setTasks');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    taskClient = jasmine.createSpyObj('taskClient', ['fetchTasks']);
    fakeWindow = { location: { hash: '#/games/demo/tasks' } };
    globalThis.window = fakeWindow;
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches tasks and pagination when the user can edit the game', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
      const headers = new Map([['page', '1'], ['pages', '2'], ['per_page', '10']]);
      taskClient.fetchTasks.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{
          id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
        }]),
        headers: { get: (key) => headers.get(key) },
      }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError, taskClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(taskClient.fetchTasks).toHaveBeenCalledWith('demo', null, jasmine.any(URLSearchParams));
      expect(setTasks).toHaveBeenCalledWith([{
        id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
      }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 2, perPage: 10 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the user cannot edit the game', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError, taskClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(taskClient.fetchTasks).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError, taskClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(taskClient.fetchTasks).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the tasks fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
      taskClient.fetchTasks.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError, taskClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load tasks.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
      taskClient.fetchTasks.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        headers: { get: () => null },
      }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError, taskClient,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTasks).not.toHaveBeenCalled();
      expect(setPagination).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
