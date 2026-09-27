import { renderToStaticMarkup } from 'react-dom/server';
import GameTasksHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import SingleResourcePickerField
  from '../../../../../../../../assets/js/components/common/forms/SingleResourcePickerField.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { findElement } from '../../../../common/forms/helpers/support.js';

/**
 * Covers the task session display and add-form session picker added to `GameTasksHelper` in issue #1432 — split into its own
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

  describe('add form session picker', function() {
    const renderPicker = (overrides = {}, formHandlers = handlers) => {
      const element = GameTasksHelper.render(
        {
          tasks: [],
          pagination,
          gameSlug: 'demo',
          basePath: '#/games/demo/tasks',
          backHref: '#/games/demo',
          formValues,
          fieldErrors: {},
          ...overrides,
        },
        formHandlers,
      );

      return findElement(
        element, (node) => node.type === SingleResourcePickerField && node.props.id === 'game-tasks-new-session',
      );
    };

    it('searches the game sessions, capped at 5 entries', function() {
      const picker = renderPicker();

      expect(picker.props.picker).toEqual({ resource: 'session', maxEntries: 5, params: { gameSlug: 'demo' } });
      expect(picker.props.label).toBe(Translator.t('game_tasks_page.new_session_label'));
      expect(picker.props.searchPlaceholder).toBe(Translator.t('game_tasks_page.new_session_search_placeholder'));
    });

    it('starts with no session picked', function() {
      expect(renderPicker().props.value).toBeNull();
    });

    it('shows the picked session', function() {
      const session = { id: 3, name: 'Session 3' };
      const picker = renderPicker({ formValues: { ...formValues, session } });

      expect(picker.props.value).toEqual(session);
    });

    it('stores the picked session item in the form values', function() {
      const onFormChange = jasmine.createSpy('onFormChange');
      const picker = renderPicker({}, { ...handlers, onFormChange });

      picker.props.onChange({ id: 3, name: 'Session 3' });

      expect(onFormChange).toHaveBeenCalledWith({ ...formValues, session: { id: 3, name: 'Session 3' } });
    });

    it('clears the session back to null', function() {
      const onFormChange = jasmine.createSpy('onFormChange');
      const picker = renderPicker(
        { formValues: { ...formValues, session: { id: 3, name: 'Session 3' } } }, { ...handlers, onFormChange },
      );

      picker.props.onClear();

      expect(onFormChange).toHaveBeenCalledWith({ ...formValues, session: null });
    });

    it('passes the session field errors', function() {
      const picker = renderPicker({ fieldErrors: { session: ['session_wrong_game'] } });

      expect(picker.props.errors).toEqual(['session_wrong_game']);
    });
  });
});
