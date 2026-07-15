import { renderToStaticMarkup } from 'react-dom/server';
import PollFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/PollFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('PollFiltersHelper', function() {
  describe('.render', function() {
    const handlers = { onStatusChange: Noop.noop, onQuery: Noop.noop, onClear: Noop.noop };

    it('renders the status select, query and clear buttons', function() {
      const html = renderToStaticMarkup(PollFiltersHelper.render({ status: '' }, handlers));

      expect(html).toContain('data-testid="poll-filters"');
      expect(html).toContain('data-testid="poll-filter-status"');
      expect(html).toContain('data-testid="poll-filter-query"');
      expect(html).toContain('data-testid="poll-filter-clear"');
    });

    it('renders the current status value as selected', function() {
      const html = renderToStaticMarkup(PollFiltersHelper.render({ status: 'closed' }, handlers));
      const selectStart = html.indexOf('data-testid="poll-filter-status"');

      expect(selectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
    });
  });
});
