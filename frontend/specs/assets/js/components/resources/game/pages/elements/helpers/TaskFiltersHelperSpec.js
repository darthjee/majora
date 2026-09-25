import { renderToStaticMarkup } from 'react-dom/server';
import TaskFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelper.jsx';
import { TASK_CATEGORY_VALUES }
  from '../../../../../../../../../assets/js/components/resources/game/pages/taskCategories.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

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
  });
});
