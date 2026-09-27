import { renderToStaticMarkup } from 'react-dom/server';
import TaskFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelper.jsx';
import { TASK_CATEGORY_VALUES }
  from '../../../../../../../../../assets/js/components/resources/game/pages/taskCategories.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import SingleResourcePickerField
  from '../../../../../../../../../assets/js/components/common/forms/SingleResourcePickerField.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';
import { findElement } from '../../../../../common/forms/helpers/support.js';

describe('TaskFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onCategoryChange: Noop.noop, onCompletedChange: Noop.noop, onQuery: Noop.noop, onClear: Noop.noop,
    };
    const render = (state) => renderToStaticMarkup(TaskFiltersHelper.render(state, handlers));
    const selectMarkup = (html, testId) => {
      const start = html.indexOf(`data-testid="${testId}"`);

      return html.slice(start, html.indexOf('</select>', start));
    };

    it('renders the category and status selects, query and clear buttons', function() {
      const html = render({ category: '', completed: '' });

      expect(html).toContain('data-testid="task-filters"');
      expect(html).toContain('data-testid="task-filter-category"');
      expect(html).toContain('data-testid="task-filter-completed"');
      expect(html).toContain('data-testid="task-filter-query"');
      expect(html).toContain('data-testid="task-filter-clear"');
    });

    it('renders the category and status labels', function() {
      const html = render({ category: '', completed: '' });

      expect(html).toContain('>Category</label>');
      expect(html).toContain('>Status</label>');
    });

    it('renders every category option in order, with other last', function() {
      const select = selectMarkup(render({ category: '', completed: '' }), 'task-filter-category');
      const values = [...select.matchAll(/value="([^"]*)"/g)].map((match) => match[1]);

      expect(values).toEqual(['', ...TASK_CATEGORY_VALUES]);
      expect(values[values.length - 1]).toBe('other');
      expect(select).toContain('Painting');
    });

    it('renders the pending and completed status options in order', function() {
      const select = selectMarkup(render({ category: '', completed: '' }), 'task-filter-completed');
      const values = [...select.matchAll(/value="([^"]*)"/g)].map((match) => match[1]);

      expect(values).toEqual(['', 'false', 'true']);
      expect(select).toContain('>Pending</option>');
      expect(select).toContain('>Completed</option>');
    });

    it('renders the current category value as selected', function() {
      const select = selectMarkup(render({ category: 'painting', completed: '' }), 'task-filter-category');

      expect(select).toContain('<option value="painting" selected="">');
    });

    it('renders the current completed value as selected', function() {
      const select = selectMarkup(render({ category: '', completed: 'true' }), 'task-filter-completed');

      expect(select).toContain('<option value="true" selected="">');
    });

    describe('session filter', function() {
      const sessionHandlers = {
        ...handlers,
        onSessionModeChange: jasmine.createSpy('onSessionModeChange'),
        onSessionPick: jasmine.createSpy('onSessionPick'),
        onSessionClear: jasmine.createSpy('onSessionClear'),
      };
      const buildState = (overrides = {}) => ({
        category: '', completed: '', sessionMode: '', sessionPick: null, gameSlug: 'demo', ...overrides,
      });
      const findPicker = (state) => findElement(
        TaskFiltersHelper.render(state, sessionHandlers), (node) => node.type === SingleResourcePickerField,
      );

      it('renders the session mode select with blank, none and specific options', function() {
        const html = renderToStaticMarkup(TaskFiltersHelper.render(buildState(), sessionHandlers));
        const select = selectMarkup(html, 'task-filter-session');
        const values = [...select.matchAll(/value="([^"]*)"/g)].map((match) => match[1]);

        expect(values).toEqual(['', 'none', 'specific']);
        expect(select).toContain(`>${Translator.t('game_tasks_page.filter_session_none')}</option>`);
        expect(html).toContain(`>${Translator.t('game_tasks_page.filter_session_label')}</label>`);
      });

      it('renders the current session mode as selected', function() {
        const html = renderToStaticMarkup(TaskFiltersHelper.render(buildState({ sessionMode: 'none' }), sessionHandlers));

        expect(selectMarkup(html, 'task-filter-session')).toContain('<option value="none" selected="">');
      });

      it('does not render the session picker in the blank mode', function() {
        expect(findPicker(buildState())).toBeNull();
      });

      it('does not render the session picker in the none mode', function() {
        expect(findPicker(buildState({ sessionMode: 'none' }))).toBeNull();
      });

      it('renders the game session picker in the specific mode', function() {
        const sessionPick = { id: 3, name: 'Session 3' };
        const picker = findPicker(buildState({ sessionMode: 'specific', sessionPick }));

        expect(picker.props.id).toBe('task-filter-session-pick');
        expect(picker.props.picker).toEqual({ resource: 'session', maxEntries: 5, params: { gameSlug: 'demo' } });
        expect(picker.props.value).toEqual(sessionPick);
        expect(picker.props.onChange).toBe(sessionHandlers.onSessionPick);
        expect(picker.props.onClear).toBe(sessionHandlers.onSessionClear);
        expect(picker.props.searchPlaceholder)
          .toBe(Translator.t('game_tasks_page.filter_session_search_placeholder'));
      });
    });
  });
});
