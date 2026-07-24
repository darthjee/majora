import itemExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/itemExchangeTabs.js';
import AcquireItemTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireItemTab.jsx';
import RemoveItemTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveItemTab.jsx';

describe('itemExchangeTabs', function() {
  it('declares an acquire tab with label, tooltip, and component keys', function() {
    expect(itemExchangeTabs.acquire).toEqual({
      labelKey: 'item_exchange_modal.acquire_tab',
      tooltipKey: 'item_exchange_modal.acquire_tab_tooltip',
      Component: AcquireItemTab,
    });
  });

  it('declares a remove tab with label, tooltip, and component keys', function() {
    expect(itemExchangeTabs.remove).toEqual({
      labelKey: 'item_exchange_modal.remove_tab',
      tooltipKey: 'item_exchange_modal.remove_tab_tooltip',
      Component: RemoveItemTab,
    });
  });

  it('declares no buy/sell tabs — items have no quantity/money interaction', function() {
    expect(itemExchangeTabs.buy).toBeUndefined();
    expect(itemExchangeTabs.sell).toBeUndefined();
  });
});
