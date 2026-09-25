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
        onQuery: jasmine.createSpy('onQuery'), onClear: jasmine.createSpy('onClear'), ...props,
      }),
    );

    return getCaptured();
  };

  it('renders blank draft values when the hash has no filter params', function() {
    const captured = renderWithHash('#/games/demo/tasks');

    expect(captured.state).toEqual({ category: '', completed: '' });
  });

  it('pre-populates the draft values from the hash query params (deep link)', function() {
    const captured = renderWithHash('#/games/demo/tasks?category=painting&completed=false');

    expect(captured.state).toEqual({ category: 'painting', completed: 'false' });
  });

  it('leaves the selects blank when the hash has unknown values', function() {
    const captured = renderWithHash('#/games/demo/tasks?category=dancing&completed=maybe');

    expect(captured.state).toEqual({ category: '', completed: '' });
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
