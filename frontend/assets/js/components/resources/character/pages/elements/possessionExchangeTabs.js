import AcquirePossessionTab from './tabs/AcquirePossessionTab.jsx';
import RemovePossessionTab from './tabs/RemovePossessionTab.jsx';

/**
 * Config map driving {@link ResourceExchangeModal}'s tab composition for the possession exchange
 * modal (issue #1076) — mirrors `documentExchangeTabs.js`'s shape, but with only the Acquire and
 * Remove tabs (no Buy/Sell, those stay treasure-only since `CharacterPossession` has no `quantity`/
 * money interaction).
 */
export default {
  acquire: {
    labelKey: 'possession_exchange_modal.acquire_tab',
    tooltipKey: 'possession_exchange_modal.acquire_tab_tooltip',
    Component: AcquirePossessionTab,
  },
  remove: {
    labelKey: 'possession_exchange_modal.remove_tab',
    tooltipKey: 'possession_exchange_modal.remove_tab_tooltip',
    Component: RemovePossessionTab,
  },
};
