import treasureExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js';
import AcquireTreasureTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireTreasureTab.jsx';
import BuyTreasureTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTab.jsx';
import RemoveTreasureTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveTreasureTab.jsx';
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

  it('declares an acquire tab with label, tooltip, and component keys', function() {
    expect(treasureExchangeTabs.acquire).toEqual({
      labelKey: 'treasure_exchange_modal.acquire_tab',
      tooltipKey: 'treasure_exchange_modal.acquire_tab_tooltip',
      Component: AcquireTreasureTab,
    });
  });

  it('declares a remove tab with label, tooltip, and component keys', function() {
    expect(treasureExchangeTabs.remove).toEqual({
      labelKey: 'treasure_exchange_modal.remove_tab',
      tooltipKey: 'treasure_exchange_modal.remove_tab_tooltip',
      Component: RemoveTreasureTab,
    });
  });
});
