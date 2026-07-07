import { renderToStaticMarkup } from 'react-dom/server';
import NpcFiltersHelper from '../../../../../../assets/js/components/elements/helpers/NpcFiltersHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('NpcFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onStatusChange: Noop.noop,
      onNameChange: Noop.noop,
      onQuery: Noop.noop,
      onClear: Noop.noop,
    };

    it('renders the status select, name input, query and clear buttons', function() {
      const html = renderToStaticMarkup(
        NpcFiltersHelper.render({ status: '', name: '' }, handlers)
      );

      expect(html).toContain('data-testid="npc-filters"');
      expect(html).toContain('data-testid="npc-filter-status"');
      expect(html).toContain('data-testid="npc-filter-name"');
      expect(html).toContain('data-testid="npc-filter-query"');
      expect(html).toContain('data-testid="npc-filter-clear"');
    });

    it('renders the current status and name values', function() {
      const html = renderToStaticMarkup(
        NpcFiltersHelper.render({ status: 'slain', name: 'gob' }, handlers)
      );

      expect(html).toContain('value="gob"');
    });
  });
});
