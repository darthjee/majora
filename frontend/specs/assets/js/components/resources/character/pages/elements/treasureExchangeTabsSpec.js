import treasureExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js';
import BuyTreasureTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTab.jsx';
import SellTreasureTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/SellTreasureTab.jsx';

describe('treasureExchangeTabs', function() {
  it('declares a buy tab with label, tooltip, and component keys', function() {
    expect(treasureExchangeTabs.buy).toEqual({
      labelKey: 'treasure_exchange_modal.buy_tab',
      tooltipKey: 'treasure_exchange_modal.buy_tab_tooltip',
      Component: BuyTreasureTab,
    });
  });

  it('declares a sell tab with label, tooltip, and component keys', function() {
    expect(treasureExchangeTabs.sell).toEqual({
      labelKey: 'treasure_exchange_modal.sell_tab',
      tooltipKey: 'treasure_exchange_modal.sell_tab_tooltip',
      Component: SellTreasureTab,
    });
  });
});
