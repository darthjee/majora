import recipeExchangeTabs from '../../../../../../../../assets/js/components/resources/character/pages/elements/recipeExchangeTabs.js';
import AcquireRecipeTab from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/AcquireRecipeTab.jsx';
import RemoveRecipeTab from '../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/RemoveRecipeTab.jsx';

describe('recipeExchangeTabs', function() {
  it('declares an acquire tab', function() {
    expect(recipeExchangeTabs.acquire).toEqual({
      labelKey: 'recipe_exchange_modal.acquire_tab',
      tooltipKey: 'recipe_exchange_modal.acquire_tab_tooltip',
      Component: AcquireRecipeTab,
    });
  });

  it('declares a remove tab', function() {
    expect(recipeExchangeTabs.remove).toEqual({
      labelKey: 'recipe_exchange_modal.remove_tab',
      tooltipKey: 'recipe_exchange_modal.remove_tab_tooltip',
      Component: RemoveRecipeTab,
    });
  });

  it('declares no buy/sell tabs', function() {
    expect(Object.keys(recipeExchangeTabs)).toEqual(['acquire', 'remove']);
  });
});
