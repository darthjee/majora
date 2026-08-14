import factionExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/factionExchangeTabs.js';
import AcquireFactionTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireFactionTab.jsx';
import RemoveFactionTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveFactionTab.jsx';

describe('factionExchangeTabs', function() {
  it('declares an acquire ("Enlist") tab with label, tooltip, and component keys', function() {
    expect(factionExchangeTabs.acquire).toEqual({
      labelKey: 'faction_exchange_modal.acquire_tab',
      tooltipKey: 'faction_exchange_modal.acquire_tab_tooltip',
      Component: AcquireFactionTab,
    });
  });

  it('declares a remove ("Quit") tab with label, tooltip, and component keys', function() {
    expect(factionExchangeTabs.remove).toEqual({
      labelKey: 'faction_exchange_modal.remove_tab',
      tooltipKey: 'faction_exchange_modal.remove_tab_tooltip',
      Component: RemoveFactionTab,
    });
  });

  it('declares no buy/sell tabs — factions have no quantity/money interaction', function() {
    expect(factionExchangeTabs.buy).toBeUndefined();
    expect(factionExchangeTabs.sell).toBeUndefined();
  });
});
