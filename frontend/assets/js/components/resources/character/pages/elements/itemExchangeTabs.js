import AcquireItemTab from './tabs/AcquireItemTab.jsx';
import RemoveItemTab from './tabs/RemoveItemTab.jsx';

/**
 * Config map driving {@link ResourceExchangeModal}'s tab composition for the item exchange
 * modal (issue #773) — mirrors `treasureExchangeTabs.js`'s shape, but with only the Acquire and
 * Remove tabs (no Buy/Sell, those stay treasure-only since `CharacterItem` has no `quantity`/
 * money interaction).
 */
export default {
  acquire: {
    labelKey: 'item_exchange_modal.acquire_tab',
    tooltipKey: 'item_exchange_modal.acquire_tab_tooltip',
    Component: AcquireItemTab,
  },
  remove: {
    labelKey: 'item_exchange_modal.remove_tab',
    tooltipKey: 'item_exchange_modal.remove_tab_tooltip',
    Component: RemoveItemTab,
  },
};
