import possessionExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/possessionExchangeTabs.js';
import AcquirePossessionTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquirePossessionTab.jsx';
import RemovePossessionTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemovePossessionTab.jsx';

describe('possessionExchangeTabs', function() {
  it('declares an acquire tab with label, tooltip, and component keys', function() {
    expect(possessionExchangeTabs.acquire).toEqual({
      labelKey: 'possession_exchange_modal.acquire_tab',
      tooltipKey: 'possession_exchange_modal.acquire_tab_tooltip',
      Component: AcquirePossessionTab,
    });
  });

  it('declares a remove tab with label, tooltip, and component keys', function() {
    expect(possessionExchangeTabs.remove).toEqual({
      labelKey: 'possession_exchange_modal.remove_tab',
      tooltipKey: 'possession_exchange_modal.remove_tab_tooltip',
      Component: RemovePossessionTab,
    });
  });

  it('declares no buy/sell tabs — possessions have no quantity/money interaction', function() {
    expect(possessionExchangeTabs.buy).toBeUndefined();
    expect(possessionExchangeTabs.sell).toBeUndefined();
  });
});
