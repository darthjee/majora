import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SessionTasksWidget, {
  buildSessionTaskHandlers, buildSessionTaskSaveHandler, runSessionTasksEffect,
} from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/SessionTasksWidget.jsx';
import SessionTasksWidgetController
  from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/controllers/SessionTasksWidgetController.js';
import SessionTasksWidgetHelper
  from '../../../../../../../../assets/js/components/resources/game_session/pages/elements/helpers/SessionTasksWidgetHelper.jsx';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('SessionTasksWidget', function() {
  const task = {
    id: 1, short_description: 'Print minis', long_description: '', completed: false, category: 'printing',
    session: { id: 3, title: 'Session 3' },
  };
  const otherTask = { ...task, id: 2, short_description: 'Buy snacks' };

  describe('rendering', function() {
    let ensureSpy;

    beforeEach(function() {
      ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(new Promise(Noop.noop));
    });

    const renderHtml = (session) => renderToStaticMarkup(React.createElement(SessionTasksWidget, { session }));

    it('renders nothing and makes no request when the session is not editable', function() {
      expect(renderHtml({ id: 3, game_slug: 'demo', can_edit: false })).toBe('');
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it('renders nothing when can_edit is missing', function() {
      expect(renderHtml({ id: 3, game_slug: 'demo' })).toBe('');
    });

    it('renders nothing when there is no session', function() {
      expect(renderHtml(null)).toBe('');
    });

    it('renders the widget in its loading state for an editable session', function() {
      const html = renderHtml({ id: 3, game_slug: 'demo', can_edit: true });

      expect(html).toContain('data-testid="session-tasks"');
    });

    it('passes the session state to the helper', function() {
      let captured;
      spyOn(SessionTasksWidgetHelper, 'render').and.callFake((state, handlers) => {
        captured = { state, handlers };
        return React.createElement('div', null, 'widget');
      });

      renderHtml({ id: 3, game_slug: 'demo', can_edit: true });

      expect(captured.state).toEqual({
        tasks: [], total: 0, loading: true, error: '', gameSlug: 'demo', sessionId: 3,
      });
      expect(captured.handlers.onToggle).toEqual(jasmine.any(Function));
      expect(captured.handlers.onView).toEqual(jasmine.any(Function));
    });
  });

  describe('runSessionTasksEffect', function() {
    it('does not build the effect when not visible', function() {
      const controller = { buildEffect: jasmine.createSpy('buildEffect') };

      expect(runSessionTasksEffect(controller, false, 'demo', 3)).toBeUndefined();
      expect(controller.buildEffect).not.toHaveBeenCalled();
    });

    it('fetches the session tasks with per_page 5 when visible', function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(new Promise(Noop.noop));
      const controller = new SessionTasksWidgetController(
        jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
      );

      const cleanup = runSessionTasksEffect(controller, true, 'demo', 3);

      expect(ensureSpy.calls.mostRecent().args[0].query).toEqual({ session: '3', per_page: '5' });
      expect(ensureSpy.calls.mostRecent().args[0].params).toEqual({ gameSlug: 'demo' });
      expect(cleanup).toEqual(jasmine.any(Function));

      cleanup();
    });
  });

  describe('buildSessionTaskHandlers', function() {
    it('opens the modal on View', function() {
      const setSelectedTask = jasmine.createSpy('setSelectedTask');
      const handlers = buildSessionTaskHandlers({}, {
        gameSlug: 'demo', tasks: [task], setTasks: jasmine.createSpy(), setSelectedTask,
      });

      handlers.onView(task);

      expect(setSelectedTask).toHaveBeenCalledWith(task);
    });

    it('toggles through the controller', function() {
      const controller = { handleToggle: jasmine.createSpy('handleToggle') };
      const setTasks = jasmine.createSpy('setTasks');
      const handlers = buildSessionTaskHandlers(controller, {
        gameSlug: 'demo', tasks: [task], setTasks, setSelectedTask: jasmine.createSpy(),
      });

      handlers.onToggle(task);

      expect(controller.handleToggle).toHaveBeenCalledWith('demo', task, [task], setTasks);
    });
  });

  describe('buildSessionTaskSaveHandler', function() {
    let setTasks;
    let setTotal;
    let setSelectedTask;
    let mutateSpy;

    const values = {
      category: 'printing', session: { id: 3, name: 'Session 3' }, shortDescription: 'New', longDescription: '',
    };

    const buildHandler = () => buildSessionTaskSaveHandler({
      gameSlug: 'demo', sessionId: 3, tasks: [task, otherTask], setTasks, setTotal, setSelectedTask,
    });

    const respondWith = (updated) => mutateSpy.and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve(updated) }),
    );

    beforeEach(function() {
      setTasks = jasmine.createSpy('setTasks');
      setTotal = jasmine.createSpy('setTotal');
      setSelectedTask = jasmine.createSpy('setSelectedTask');
      mutateSpy = spyOn(RequestStore, 'mutate');
    });

    it('updates the task in place and keeps it when it stays in the session', async function() {
      const updated = { ...task, short_description: 'New' };
      respondWith(updated);

      const result = await buildHandler()(task, values);

      expect(result).toEqual(updated);
      expect(mutateSpy.calls.mostRecent().args[0].componentName).toBe('SessionTasksWidget');
      expect(setTasks.calls.allArgs()).toEqual([[[updated, otherTask]]]);
      expect(setTotal).not.toHaveBeenCalled();
    });

    it('replaces the selected task only when it is still selected', async function() {
      const updated = { ...task, short_description: 'New' };
      respondWith(updated);

      await buildHandler()(task, values);
      const updater = setSelectedTask.calls.mostRecent().args[0];

      expect(updater(task)).toEqual(updated);
      expect(updater(otherTask)).toBe(otherTask);
      expect(updater(null)).toBeNull();
    });

    it('drops a task whose session changed and decrements the total', async function() {
      const updated = { ...task, session: { id: 4, title: 'Session 4' } };
      respondWith(updated);

      await buildHandler()(task, { ...values, session: { id: 4, name: 'Session 4' } });
      const removeUpdater = setTasks.calls.mostRecent().args[0];
      const totalUpdater = setTotal.calls.mostRecent().args[0];

      expect(removeUpdater([updated, otherTask])).toEqual([otherTask]);
      expect(totalUpdater(7)).toBe(6);
    });

    it('drops a task that was unassigned from the session', async function() {
      respondWith({ ...task, session: null });

      await buildHandler()(task, { ...values, session: null });

      expect(setTotal).toHaveBeenCalled();
    });

    it('returns null and changes nothing else when the save fails', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      const result = await buildHandler()(task, values);

      expect(result).toBeNull();
      expect(setTasks).not.toHaveBeenCalled();
      expect(setTotal).not.toHaveBeenCalled();
      expect(setSelectedTask).not.toHaveBeenCalled();
    });
  });
});
