import { saveTaskEdit, toggleTaskCompleted }
  from '../../../../../../../assets/js/components/resources/game/pages/taskMutations.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('taskMutations', function() {
  let setTasks;
  let tasks;
  let mutateSpy;

  beforeEach(function() {
    setTasks = jasmine.createSpy('setTasks');
    tasks = [
      {
        id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null, category: 'painting',
      },
      {
        id: 2, short_description: 'Buy snacks', long_description: '', completed: false, session: null,
      },
    ];
    mutateSpy = spyOn(RequestStore, 'mutate');
  });

  describe('toggleTaskCompleted', function() {
    it('optimistically toggles and applies the server response on success', async function() {
      const updated = { ...tasks[0], completed: true };
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(updated) }));

      await toggleTaskCompleted('SessionTasksWidget', 'demo', tasks[0], tasks, setTasks);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'SessionTasksWidget',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 1 },
        body: { completed: true },
      });
      expect(setTasks.calls.allArgs()).toEqual([
        [[{ ...tasks[0], completed: true }, tasks[1]]],
        [[updated, tasks[1]]],
      ]);
    });

    it('sends completed false when un-completing a task', async function() {
      const completedTask = { ...tasks[0], completed: true };
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(tasks[0]) }));

      await toggleTaskCompleted('SessionTasksWidget', 'demo', completedTask, [completedTask, tasks[1]], setTasks);

      expect(mutateSpy.calls.mostRecent().args[0].body).toEqual({ completed: false });
    });

    it('rolls back to the original tasks when the update response is not ok', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      await toggleTaskCompleted('SessionTasksWidget', 'demo', tasks[0], tasks, setTasks);

      expect(setTasks.calls.mostRecent().args[0]).toBe(tasks);
    });

    it('rolls back to the original tasks when the update request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      await toggleTaskCompleted('SessionTasksWidget', 'demo', tasks[0], tasks, setTasks);

      expect(setTasks.calls.mostRecent().args[0]).toBe(tasks);
    });
  });

  describe('saveTaskEdit', function() {
    const formValues = { category: 'painting', shortDescription: 'New', longDescription: 'New details' };

    it('sends the edited values and updates the matching task on success', async function() {
      const updated = { ...tasks[0], short_description: 'New', long_description: 'New details' };
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(updated) }));

      const result = await saveTaskEdit('SessionTasksWidget', 'demo', tasks[0], formValues, tasks, setTasks);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'SessionTasksWidget',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 1 },
        body: {
          category: 'painting',
          session: null,
          short_description: 'New',
          long_description: 'New details',
        },
      });
      expect(setTasks).toHaveBeenCalledWith([updated, tasks[1]]);
      expect(result).toEqual(updated);
    });

    it('sends the picked session id in the PATCH body', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(tasks[0]) }));

      await saveTaskEdit(
        'SessionTasksWidget', 'demo', tasks[0], { ...formValues, session: { id: 3, name: 'Session 3' } }, tasks, setTasks,
      );

      expect(mutateSpy.calls.mostRecent().args[0].body.session).toBe(3);
    });

    it('returns null without updating state when the response is not ok', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      const result = await saveTaskEdit('SessionTasksWidget', 'demo', tasks[0], formValues, tasks, setTasks);

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null without updating state when the request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      const result = await saveTaskEdit('SessionTasksWidget', 'demo', tasks[0], formValues, tasks, setTasks);

      expect(setTasks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
