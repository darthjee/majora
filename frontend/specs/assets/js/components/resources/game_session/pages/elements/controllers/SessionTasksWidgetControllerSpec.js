import SessionTasksWidgetController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/elements/controllers/SessionTasksWidgetController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('SessionTasksWidgetController', function() {
  let setTasks;
  let setTotal;
  let setLoading;
  let setError;
  let ensureSpy;
  let controller;

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(function() {
    setTasks = jasmine.createSpy('setTasks');
    setTotal = jasmine.createSpy('setTotal');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    ensureSpy = spyOn(RequestStore, 'ensure');
    controller = new SessionTasksWidgetController(setTasks, setTotal, setLoading, setError);
  });

  describe('#buildEffect', function() {
    const tasks = [{ id: 1, short_description: 'Print minis', completed: false }];

    it('fetches the first 5 tasks of the session', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: tasks, pagination: { total: 7 } }));

      const cleanup = controller.buildEffect('demo', 3)();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'SessionTasksWidgetController',
        resource: 'task',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: { session: '3', per_page: '5' },
      });

      cleanup();
    });

    it('sets the tasks, the total and clears loading on success', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: tasks, pagination: { total: 7 } }));

      const cleanup = controller.buildEffect('demo', 3)();
      await flush();

      expect(setTasks).toHaveBeenCalledWith(tasks);
      expect(setTotal).toHaveBeenCalledWith(7);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('guards against a non-array data payload and a missing pagination', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));

      const cleanup = controller.buildEffect('demo', 3)();
      await flush();

      expect(setTasks).toHaveBeenCalledWith([]);
      expect(setTotal).toHaveBeenCalledWith(0);

      cleanup();
    });

    it('sets the translated error and clears loading on failure', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = controller.buildEffect('demo', 3)();
      await flush();

      expect(setError).toHaveBeenCalledWith(Translator.t('game_session_page.tasks_error'));
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setTasks).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: tasks, pagination: { total: 7 } }));

      const cleanup = controller.buildEffect('demo', 3)();
      cleanup();
      await flush();

      expect(setTasks).not.toHaveBeenCalled();
      expect(setTotal).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });

    it('does not set the error after unmount', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = controller.buildEffect('demo', 3)();
      cleanup();
      await flush();

      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('#handleToggle', function() {
    it('toggles the task through the shared mutation', async function() {
      const task = { id: 1, completed: false };
      const updated = { id: 1, completed: true };
      const mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve(updated) }),
      );
      const listSetter = jasmine.createSpy('setTasks');

      await controller.handleToggle('demo', task, [task], listSetter);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'SessionTasksWidgetController',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 1 },
        body: { completed: true },
      });
      expect(listSetter).toHaveBeenCalledWith([updated]);
    });
  });
});
