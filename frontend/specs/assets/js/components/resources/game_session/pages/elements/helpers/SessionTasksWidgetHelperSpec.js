import { renderToStaticMarkup } from 'react-dom/server';
import SessionTasksWidgetHelper
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/elements/helpers/SessionTasksWidgetHelper.jsx';
import TaskListItem
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/TaskListItem.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';
import { findElement } from '../../../../../common/forms/helpers/support.js';

describe('SessionTasksWidgetHelper', function() {
  const tasks = [
    {
      id: 1, short_description: 'Print minis', completed: false, category: 'printing',
      session: { id: 3, title: 'Session 3' },
    },
    {
      id: 2, short_description: 'Buy snacks', completed: true, category: 'buying',
      session: { id: 3, title: 'Session 3' },
    },
  ];
  const handlers = { onToggle: Noop.noop, onView: Noop.noop };
  const baseState = {
    tasks, total: 2, loading: false, error: '', gameSlug: 'demo', sessionId: 3,
  };

  const renderHtml = (overrides = {}) => renderToStaticMarkup(
    SessionTasksWidgetHelper.render({ ...baseState, ...overrides }, handlers),
  );

  it('renders a titled section', function() {
    const html = renderHtml();

    expect(html).toContain('data-testid="session-tasks"');
    expect(html).toContain(`<h2>${Translator.t('game_session_page.tasks_title')}</h2>`);
  });

  it('renders the loading message while loading', function() {
    const html = renderHtml({ loading: true, tasks: [], total: 0 });

    expect(html).toContain(Translator.t('game_session_page.tasks_loading'));
    expect(html).not.toContain('list-group');
  });

  it('renders the error', function() {
    const html = renderHtml({ error: 'Unable to load tasks.', tasks: [], total: 0 });

    expect(html).toContain('<div class="alert alert-danger" role="alert">Unable to load tasks.</div>');
    expect(html).not.toContain('list-group');
  });

  it('renders the empty message when the session has no tasks', function() {
    const html = renderHtml({ tasks: [], total: 0 });

    expect(html).toContain(Translator.t('game_session_page.tasks_empty'));
    expect(html).not.toContain('list-group');
  });

  it('renders the tasks checklist without the session title', function() {
    const html = renderHtml();

    expect(html).toContain('Print minis');
    expect(html).toContain('Buy snacks');
    expect(html).toContain('id="session-task-1"');
    expect(html).toContain('id="session-task-2"');
    expect(html).not.toContain('task-session');
  });

  it('wires the list handlers into each row', function() {
    const onToggle = jasmine.createSpy('onToggle');
    const onView = jasmine.createSpy('onView');
    const element = SessionTasksWidgetHelper.render(baseState, { onToggle, onView });
    const row = findElement(element, (node) => node.type === TaskListItem);

    expect(row.props.onToggle).toBe(onToggle);
    expect(row.props.onView).toBe(onView);
    expect(row.props.showSession).toBeFalse();
    expect(row.props.idPrefix).toBe('session-task');
  });

  it('does not render the see all link when every task is listed', function() {
    expect(renderHtml()).not.toContain('href=');
  });

  it('renders the see all link to the tasks page filtered by the session when there are more tasks', function() {
    const html = renderHtml({ total: 7 });

    expect(html).toContain('href="#/games/demo/tasks?page=1&amp;session=3"');
    expect(html).toContain(Translator.t('game_session_page.tasks_see_all').replace('{{count}}', 7));
  });

  it('does not render the see all link while loading or on error', function() {
    expect(renderHtml({ loading: true, total: 7 })).not.toContain('href=');
    expect(renderHtml({ error: 'Unable to load tasks.', total: 7 })).not.toContain('href=');
  });
});
