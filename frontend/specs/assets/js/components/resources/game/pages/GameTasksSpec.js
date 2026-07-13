import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTasks from '../../../../../../../assets/js/components/resources/game/pages/GameTasks.jsx';
import GameTasksHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import GameTasksController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
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
          formValues: { shortDescription: '', longDescription: '' },
          fieldErrors: {},
        },
        handlers,
      ),
    );

    expect(html).toContain('Prep encounter');
    expect(html).toContain('Add task');
  });
});
