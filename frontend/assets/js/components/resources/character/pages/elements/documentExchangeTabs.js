import AcquireDocumentTab from './tabs/AcquireDocumentTab.jsx';
import RemoveDocumentTab from './tabs/RemoveDocumentTab.jsx';

/**
 * Config map driving {@link ResourceExchangeModal}'s tab composition for the document exchange
 * modal (issue #920) — mirrors `itemExchangeTabs.js`'s shape, but with only the Acquire and
 * Remove tabs (no Buy/Sell, those stay treasure-only since `CharacterDocument` has no `quantity`/
 * money interaction).
 */
export default {
  acquire: {
    labelKey: 'document_exchange_modal.acquire_tab',
    tooltipKey: 'document_exchange_modal.acquire_tab_tooltip',
    Component: AcquireDocumentTab,
  },
  remove: {
    labelKey: 'document_exchange_modal.remove_tab',
    tooltipKey: 'document_exchange_modal.remove_tab_tooltip',
    Component: RemoveDocumentTab,
  },
};
