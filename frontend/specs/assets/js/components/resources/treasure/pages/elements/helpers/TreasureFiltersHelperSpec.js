import { renderToStaticMarkup } from 'react-dom/server';
import TreasureFiltersHelper from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('TreasureFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onGameTypeChange: Noop.noop,
      onMinValueChange: Noop.noop,
      onMaxValueChange: Noop.noop,
      onNameChange: Noop.noop,
      onQuery: Noop.noop,
      onClear: Noop.noop,
    };

    it('renders the game type select, min/max value inputs, name input, query and clear buttons', function() {
      const html = renderToStaticMarkup(
        TreasureFiltersHelper.render({
          gameType: '', minValue: '', maxValue: '', name: '',
        }, handlers)
      );

      expect(html).toContain('data-testid="treasure-filters"');
      expect(html).toContain('data-testid="treasure-filter-game-type"');
      expect(html).toContain('data-testid="treasure-filter-min-value"');
      expect(html).toContain('data-testid="treasure-filter-max-value"');
      expect(html).toContain('data-testid="treasure-filter-name"');
      expect(html).toContain('data-testid="treasure-filter-query"');
      expect(html).toContain('data-testid="treasure-filter-clear"');
    });

    it('renders the game type options', function() {
      const html = renderToStaticMarkup(
        TreasureFiltersHelper.render({
          gameType: '', minValue: '', maxValue: '', name: '',
        }, handlers)
      );

      expect(html).toContain('<option value="dnd">D&amp;D</option>');
      expect(html).toContain('<option value="deadlands">Deadlands</option>');
    });

    it('renders the current draft values', function() {
      const html = renderToStaticMarkup(
        TreasureFiltersHelper.render({
          gameType: 'dnd', minValue: '10', maxValue: '100', name: 'sword',
        }, handlers)
      );

      expect(html).toContain('value="10"');
      expect(html).toContain('value="100"');
      expect(html).toContain('value="sword"');
    });

    it('renders the current game type value as selected', function() {
      const html = renderToStaticMarkup(
        TreasureFiltersHelper.render({
          gameType: 'deadlands', minValue: '', maxValue: '', name: '',
        }, handlers)
      );
      const selectStart = html.indexOf('data-testid="treasure-filter-game-type"');

      expect(selectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
    });
  });
});
