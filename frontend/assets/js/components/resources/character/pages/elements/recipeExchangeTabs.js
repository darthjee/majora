import AcquireRecipeTab from './tabs/AcquireRecipeTab.jsx';
import RemoveRecipeTab from './tabs/RemoveRecipeTab.jsx';

/**
 * Config map driving {@link ResourceExchangeModal}'s tab composition for the recipe exchange
 * modal (issue #1450) — mirrors `documentExchangeTabs.js`: Acquire and Remove only.
 */
export default {
  acquire: {
    labelKey: 'recipe_exchange_modal.acquire_tab',
    tooltipKey: 'recipe_exchange_modal.acquire_tab_tooltip',
    Component: AcquireRecipeTab,
  },
  remove: {
    labelKey: 'recipe_exchange_modal.remove_tab',
    tooltipKey: 'recipe_exchange_modal.remove_tab_tooltip',
    Component: RemoveRecipeTab,
  },
};
