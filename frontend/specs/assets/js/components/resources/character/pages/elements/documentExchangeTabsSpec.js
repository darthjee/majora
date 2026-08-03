import documentExchangeTabs
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/documentExchangeTabs.js';
import AcquireDocumentTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireDocumentTab.jsx';
import RemoveDocumentTab
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveDocumentTab.jsx';

describe('documentExchangeTabs', function() {
  it('declares an acquire tab with label, tooltip, and component keys', function() {
    expect(documentExchangeTabs.acquire).toEqual({
      labelKey: 'document_exchange_modal.acquire_tab',
      tooltipKey: 'document_exchange_modal.acquire_tab_tooltip',
      Component: AcquireDocumentTab,
    });
  });

  it('declares a remove tab with label, tooltip, and component keys', function() {
    expect(documentExchangeTabs.remove).toEqual({
      labelKey: 'document_exchange_modal.remove_tab',
      tooltipKey: 'document_exchange_modal.remove_tab_tooltip',
      Component: RemoveDocumentTab,
    });
  });

  it('declares no buy/sell tabs — documents have no quantity/money interaction', function() {
    expect(documentExchangeTabs.buy).toBeUndefined();
    expect(documentExchangeTabs.sell).toBeUndefined();
  });
});
