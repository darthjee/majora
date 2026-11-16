import React from 'react';
import FilterActions from '../../../../../common/forms/FilterActions.jsx';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { CATEGORY_VALUES } from '../show/CommonItemCategoryField.jsx';

/**
 * Rendering helper for the CommonItemFilters element.
 */
export default class CommonItemFiltersHelper {
  /**
   * Renders the Name, Category, Min price and Max price fields plus Query and Clear buttons.
   * Pressing Enter inside any input triggers the query.
   *
   * @param {{name: string, category: string, minPrice: string, maxPrice: string}} state -
   *   filters draft state.
   * @param {{onNameChange: Function, onCategoryChange: Function, onMinPriceChange: Function,
   *   onMaxPriceChange: Function, onQuery: Function, onClear: Function}} handlers - filters
   *   event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    const onKeyDown = (event) => {
      if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
        event.preventDefault();
        handlers.onQuery();
      }
    };

    return (
      <div
        className="row g-2 align-items-end mb-4"
        data-testid="common-item-filters"
        onKeyDown={onKeyDown}
      >
        {CommonItemFiltersHelper.#renderTextField('name', 'text', state.name, handlers.onNameChange, true)}
        <FilterSelect
          id="common-item-filter-category"
          label={Translator.t('game_common_items_page.filter_category_label')}
          blankLabel={Translator.t('game_common_items_page.filter_category_all')}
          value={state.category}
          onChange={handlers.onCategoryChange}
          options={CATEGORY_VALUES.map((value) => ({
            value, label: Translator.t(`common_item_page.category.${value}`),
          }))}
        />
        {CommonItemFiltersHelper.#renderTextField('min-price', 'number', state.minPrice, handlers.onMinPriceChange)}
        {CommonItemFiltersHelper.#renderTextField('max-price', 'number', state.maxPrice, handlers.onMaxPriceChange)}
        <FilterActions onQuery={handlers.onQuery} onClear={handlers.onClear} testIdPrefix="common-item" />
      </div>
    );
  }

  static #renderTextField(slug, type, value, onChange, withPlaceholder = false) {
    const key = slug.replace('-', '_');
    const id = `common-item-filter-${slug}`;
    const numberProps = type === 'number' ? { min: '0', step: '1' } : {};

    return (
      <div className="col-auto">
        <label htmlFor={id} className="form-label">
          {Translator.t(`game_common_items_page.filter_${key}_label`)}
        </label>
        <input
          id={id}
          data-testid={id}
          type={type}
          className="form-control"
          placeholder={withPlaceholder ? Translator.t(`game_common_items_page.filter_${key}_placeholder`) : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...numberProps}
        />
      </div>
    );
  }
}
