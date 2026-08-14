import AcquireFactionTab from './tabs/AcquireFactionTab.jsx';
import RemoveFactionTab from './tabs/RemoveFactionTab.jsx';

/**
 * Config map driving {@link ResourceExchangeModal}'s tab composition for the faction exchange
 * modal (issue #943) — mirrors `documentExchangeTabs.js`'s shape exactly (only Acquire/Remove, no
 * Buy/Sell), but with the tab wording relabeled to "Enlist"/"Quit" per the issue — a pure i18n-key
 * swap, no component logic change: `ResourceExchangeModal`/`AcquireFactionTab`/`RemoveFactionTab`
 * never branch on the tab's own label.
 */
export default {
  acquire: {
    labelKey: 'faction_exchange_modal.acquire_tab',
    tooltipKey: 'faction_exchange_modal.acquire_tab_tooltip',
    Component: AcquireFactionTab,
  },
  remove: {
    labelKey: 'faction_exchange_modal.remove_tab',
    tooltipKey: 'faction_exchange_modal.remove_tab_tooltip',
    Component: RemoveFactionTab,
  },
};
