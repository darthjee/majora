import TreasureExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
    it('marks the buy tab active when activeTab is buy', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'buy' }), buildHandlers());
      const buyTab = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0] === 'Buy'
      );

      expect(buyTab.props.className).toContain('active');
    });

    it('marks the sell tab active when activeTab is sell', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'sell' }), buildHandlers());
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0] === 'Sell'
      );

      expect(sellTab.props.className).toContain('active');
    });

    it('invokes onTabChange with "sell" when the sell tab is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0] === 'Sell'
      );

      sellTab.props.onClick();

      expect(handlers.onTabChange).toHaveBeenCalledWith('sell');
    });

    it('renders a help-tooltip icon badge for each tab', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element).split('bi-question-circle-fill').length - 1).toBe(2);
    });
  });
});
