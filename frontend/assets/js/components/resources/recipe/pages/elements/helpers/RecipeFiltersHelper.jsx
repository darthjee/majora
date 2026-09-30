import React from 'react';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { CATEGORY_VALUES } from '../../../../common_item/pages/elements/show/CommonItemCategoryField.jsx';

/**
 * Rendering helper for the RecipeFilters element.
 */
export default class RecipeFiltersHelper {
  /**
   * Renders the category dropdown: an "all" blank option plus every `GameCommonItem` category.
   *
   * @param {{category: string}} state - Filter state.
   * @param {{onCategoryChange: Function}} handlers - Filter event handlers.
   * @returns {React.ReactElement} Rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="recipe-filters">
        <FilterSelect
          id="recipe-filter-category"
          label={Translator.t('game_recipes_page.category_filter_label')}
          blankLabel={Translator.t('game_recipes_page.category_filter_all')}
          value={state.category}
          onChange={handlers.onCategoryChange}
          options={CATEGORY_VALUES.map((value) => ({
            value, label: Translator.t(`common_item_page.category.${value}`),
          }))}
        />
      </div>
    );
  }
}
