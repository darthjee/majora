import { renderToStaticMarkup } from 'react-dom/server';
import GameTasksHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

/**
 * Covers the task session display added to `GameTasksHelper` in issue #1432 — split into its own
 * file to keep `GameTasksHelperSpec.js` under the project's 300-line limit.
 */
describe('GameTasksHelper session (issue #1432)', function() {
  const pagination = { page: 1, pages: 1, perPage: 10 };
  const formValues = { category: 'other', shortDescription: '', longDescription: '' };
  const handlers = {
    onToggle: Noop.noop,
    onFormChange: Noop.noop,
    onCreate: Noop.noop,
    onView: Noop.noop,
  };

  const renderTasks = (tasks) => renderToStaticMarkup(
    GameTasksHelper.render(
      {
        tasks, pagination, basePath: '#/games/demo/tasks', backHref: '#/games/demo', formValues, fieldErrors: {},
      },
      handlers,
    ),
  );

  it('renders the session title of a task linked to a session', function() {
    const html = renderTasks([{
      id: 1, short_description: 'Print minis', completed: false, category: 'printing',
      session: { id: 3, title: 'Session 3 — The Crypt' },
    }]);

    expect(html).toContain('<small class="task-session ms-2 text-muted">Session 3 — The Crypt</small>');
  });

  it('renders no session element for a task without a session', function() {
    const html = renderTasks([{
      id: 1, short_description: 'Print minis', completed: false, category: 'printing', session: null,
    }]);

    expect(html).not.toContain('task-session');
  });
});
