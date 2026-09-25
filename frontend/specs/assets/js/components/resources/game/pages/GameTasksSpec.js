import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTasks, { EMPTY_FORM, buildTaskFilterHandlers, resetTaskFormValues }
  from '../../../../../../../assets/js/components/resources/game/pages/GameTasks.jsx';
import GameTasksHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import GameTasksController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameTasks', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/tasks' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GameTasksController);
    stubRenderLoading(GameTasksHelper);

    const html = renderToStaticMarkup(React.createElement(GameTasks));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(GameTasksController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(GameTasks));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GameTasksController));
  });

  it('renders the add-task form via GameTasksHelper.render', function() {
    stubBuildEffect(GameTasksController);

    const tasks = [{
      id: 1, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
    }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const handlers = {
      onToggle: Noop.noop, onFormChange: Noop.noop, onCreate: Noop.noop, onView: Noop.noop,
    };

    const html = renderToStaticMarkup(
      GameTasksHelper.render(
        {
          tasks,
          pagination,
          basePath: '#/games/demo/tasks',
          backHref: '#/games/demo',
          formValues: EMPTY_FORM,
          fieldErrors: {},
        },
        handlers,
      ),
    );

    expect(html).toContain('Prep encounter');
    expect(html).toContain('Add task');
  });

  it('starts the add form at the other category with empty descriptions', function() {
    expect(EMPTY_FORM).toEqual({ category: 'other', shortDescription: '', longDescription: '' });
  });

  it('keeps the last picked category and resets the descriptions after a create', function() {
    const previous = { category: 'painting', shortDescription: 'Paint minis', longDescription: 'Goblins' };

    expect(resetTaskFormValues(previous)).toEqual({
      category: 'painting', shortDescription: '', longDescription: '',
    });
  });

  describe('buildTaskFilterHandlers', function() {
    let effect;
    let controller;

    beforeEach(function() {
      effect = jasmine.createSpy('effect');
      controller = { buildEffect: jasmine.createSpy('buildEffect').and.returnValue(effect) };
    });

    it('sets the filtered first-page hash and refetches on Query', function() {
      const handlers = buildTaskFilterHandlers(controller, '#/games/demo/tasks');

      handlers.onQuery({ category: 'painting', completed: 'false' });

      expect(globalThis.window.location.hash).toBe('#/games/demo/tasks?page=1&category=painting&completed=false');
      expect(effect).toHaveBeenCalled();
    });

    it('resets the hash to the base path and refetches on Clear', function() {
      globalThis.window.location.hash = '#/games/demo/tasks?page=1&category=painting';
      const handlers = buildTaskFilterHandlers(controller, '#/games/demo/tasks');

      handlers.onClear();

      expect(globalThis.window.location.hash).toBe('#/games/demo/tasks');
      expect(effect).toHaveBeenCalled();
    });
  });
});
