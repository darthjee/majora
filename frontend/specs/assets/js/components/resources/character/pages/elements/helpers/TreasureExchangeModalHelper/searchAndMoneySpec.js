import TreasureExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import TreasureMoney from '../../../../../../../../../../assets/js/components/common/TreasureMoney.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
    it('renders a search input bound to state.search', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ search: 'sword' }), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input' && child.props.type === 'text');

      expect(input.props.value).toBe('sword');
    });

    it('wires the search input onChange to onSearchChange', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const input = findElement(element, (child) => child.type === 'input' && child.props.type === 'text');

      input.props.onChange({ target: { value: 'crown' } });

      expect(handlers.onSearchChange).toHaveBeenCalledWith('crown');
    });

    it('renders the money display with the character money and gameType', function() {
      const element = TreasureExchangeModalHelper.render(
        true, buildState({ character: { money: 750 }, gameType: 'deadlands' }), buildHandlers()
      );
      const moneyElements = findElement(
        element, (child) => child.type === TreasureMoney && child.props.value === 750
      );

      expect(moneyElements.props.value).toBe(750);
      expect(moneyElements.props.gameType).toBe('deadlands');
    });

    it('does not render the money display when no character is given', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('your_money');
    });
  });
});
