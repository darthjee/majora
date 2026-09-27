import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TaskFilters
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/TaskFilters.jsx';
import TaskFiltersController
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/TaskFiltersController.js';
import TaskFiltersHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelper.jsx';

describe('TaskFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(TaskFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  const renderWithHash = (hash, props = {}) => {
    globalThis.window = { location: { hash } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(TaskFilters, {
        gameSlug: 'demo',
        onQuery: jasmine.createSpy('onQuery'), onClear: jasmine.createSpy('onClear'), ...props,
      }),
    );

    return getCaptured();
  };

  it('renders blank draft values when the hash has no filter params', function() {
    const captured = renderWithHash('#/games/demo/tasks');

    expect(captured.state).toEqual({
      category: '', completed: '', sessionMode: '', sessionPick: null, gameSlug: 'demo',
    });
  });

  it('pre-populates the draft values from the hash query params (deep link)', function() {
    const captured = renderWithHash('#/games/demo/tasks?category=painting&completed=false');

    expect(captured.state).toEqual({
      category: 'painting', completed: 'false', sessionMode: '', sessionPick: null, gameSlug: 'demo',
    });
  });

  it('leaves the selects blank when the hash has unknown values', function() {
    const captured = renderWithHash('#/games/demo/tasks?category=dancing&completed=maybe&session=abc');

    expect(captured.state).toEqual({
      category: '', completed: '', sessionMode: '', sessionPick: null, gameSlug: 'demo',
    });
  });

  it('starts in the none session mode for session=none', function() {
    const captured = renderWithHash('#/games/demo/tasks?session=none');

    expect(captured.state.sessionMode).toBe('none');
    expect(captured.state.sessionPick).toBeNull();
  });

  it('starts in the specific session mode, with the pick pending, for session=<id>', function() {
    const captured = renderWithHash('#/games/demo/tasks?session=3');

    expect(captured.state.sessionMode).toBe('specific');
    expect(captured.state.sessionPick).toBeNull();
  });

  it('passes the session none filter to onQuery', function() {
    const onQuery = jasmine.createSpy('onQuery');
    const captured = renderWithHash('#/games/demo/tasks?session=none', { onQuery });

    captured.handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ session: 'none' });
  });

  it('wires the session handlers to the controller', function() {
    spyOn(TaskFiltersController.prototype, 'handleSessionModeChange');
    spyOn(TaskFiltersController.prototype, 'handleSessionPick');
    const captured = renderWithHash('#/games/demo/tasks');

    captured.handlers.onSessionModeChange('specific');
    captured.handlers.onSessionPick({ id: 3, name: 'Session 3' });
    captured.handlers.onSessionClear();

    expect(TaskFiltersController.prototype.handleSessionModeChange).toHaveBeenCalledWith('specific');
    expect(TaskFiltersController.prototype.handleSessionPick.calls.allArgs()).toEqual([
      [{ id: 3, name: 'Session 3' }], [null],
    ]);
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    const onQuery = jasmine.createSpy('onQuery');
    const captured = renderWithHash('#/games/demo/tasks?category=painting&completed=true', { onQuery });

    captured.handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ category: 'painting', completed: 'true' });
  });

  it('omits blank fields from the query passed to onQuery', function() {
    const onQuery = jasmine.createSpy('onQuery');
    const captured = renderWithHash('#/games/demo/tasks?completed=false', { onQuery });

    captured.handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ completed: 'false' });
  });

  it('resets the draft fields and then calls onClear when the Clear handler runs', function() {
    const calls = [];
    spyOn(TaskFiltersController.prototype, 'clear').and.callFake(() => calls.push('clear'));
    const onClear = jasmine.createSpy('onClear').and.callFake(() => calls.push('onClear'));
    const captured = renderWithHash('#/games/demo/tasks?category=painting', { onClear });

    captured.handlers.onClear();

    expect(calls).toEqual(['clear', 'onClear']);
  });
});
