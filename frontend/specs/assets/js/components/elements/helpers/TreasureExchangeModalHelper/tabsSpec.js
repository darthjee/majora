import TreasureExchangeModalHelper
  from '../../../../../../../assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
    it('marks the acquire tab active when activeTab is acquire', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'acquire' }), buildHandlers());
      const acquireTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Acquire'
      );

      expect(acquireTab.props.className).toContain('active');
    });

    it('marks the sell tab active when activeTab is sell', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'sell' }), buildHandlers());
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Sell'
      );

      expect(sellTab.props.className).toContain('active');
    });

    it('invokes onTabChange with "sell" when the sell tab is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Sell'
      );

      sellTab.props.onClick();

      expect(handlers.onTabChange).toHaveBeenCalledWith('sell');
    });
  });
});
