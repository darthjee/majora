import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameTasksController', function() {
  let setTasks;
  let setPagination;
  let setLoading;
  let setError;
  let ensureSpy;
  let fakeWindow;

  beforeEach(function() {
    setTasks = jasmine.createSpy('setTasks');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [],
      pagination: {
        page: 1, pages: 1, perPage: 10, total: 0,
      },
    }));
    fakeWindow = { location: { hash: '#/games/demo/tasks' } };
    globalThis.window = fakeWindow;
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches tasks and pagination when the user can edit the game', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{
          id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
        }],
        pagination: {
          page: 1, pages: 2, perPage: 10, total: 11,
        },
      }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameTasksController',
        resource: 'task',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: {},
      });
      expect(setTasks).toHaveBeenCalledWith([{
        id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
      }]);
      expect(setPagination).toHaveBeenCalledWith({
        page: 1, pages: 2, perPage: 10, total: 11,
      });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the user cannot edit the game', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the tasks fetch fails', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load tasks.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = new GameTasksController(
        setTasks, setPagination, setLoading, setError,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTasks).not.toHaveBeenCalled();
      expect(setPagination).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
