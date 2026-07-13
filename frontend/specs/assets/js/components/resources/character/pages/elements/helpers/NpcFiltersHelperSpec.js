import { renderToStaticMarkup } from 'react-dom/server';
import NpcFiltersHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/NpcFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('NpcFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onStatusChange: Noop.noop,
      onNameChange: Noop.noop,
      onAllegianceChange: Noop.noop,
      onQuery: Noop.noop,
      onClear: Noop.noop,
    };

    it('renders the status select, name input, allegiance select, query and clear buttons', function() {
      const html = renderToStaticMarkup(
        NpcFiltersHelper.render({ status: '', name: '', allegiance: '' }, handlers)
      );

      expect(html).toContain('data-testid="npc-filters"');
      expect(html).toContain('data-testid="npc-filter-status"');
      expect(html).toContain('data-testid="npc-filter-name"');
      expect(html).toContain('data-testid="npc-filter-allegiance"');
      expect(html).toContain('data-testid="npc-filter-query"');
      expect(html).toContain('data-testid="npc-filter-clear"');
    });

    it('renders the current status and name values', function() {
      const html = renderToStaticMarkup(
        NpcFiltersHelper.render({ status: 'slain', name: 'gob', allegiance: 'ally' }, handlers)
      );

      expect(html).toContain('value="gob"');
    });

    it('renders the current allegiance value as selected', function() {
      const html = renderToStaticMarkup(
        NpcFiltersHelper.render({ status: '', name: '', allegiance: 'enemy' }, handlers)
      );
      const selectStart = html.indexOf('data-testid="npc-filter-allegiance"');

      expect(selectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
    });
  });
});
