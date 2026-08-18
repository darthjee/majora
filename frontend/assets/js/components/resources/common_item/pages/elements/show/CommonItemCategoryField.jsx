import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Every `GameCommonItem.category` value (issue #826), mirroring the backend's
 * `CATEGORY_*`/`CHOICES` constants — the label for each is read from
 * `common_item_page.category.<value>`, shared by the show page and this select.
 *
 * @type {string[]}
 */
export const CATEGORY_VALUES = ['potion', 'drug', 'consumable', 'ammunition', 'poison', 'gear', 'other'];

const ID_KEYS = { new: 'common-item-new-category', edit: 'common-item-edit-category' };
const LABEL_KEYS = {
  new: 'common_item_new_page.category_label',
  edit: 'common_item_edit_page.category_label',
};

/**
 * Show-mode right-column slot: the common item's category, displayed as its translated label.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.category] - Common item category value.
 * @returns {React.ReactElement} Category display element.
 */
function CommonItemCategoryFieldShow({ category }) {
  return (
    <p>
      <strong>{Translator.t('common_item_new_page.category_label')}</strong>
      {': '}
      {Translator.t(`common_item_page.category.${category ?? 'other'}`)}
    </p>
  );
}

/**
 * New/edit-mode right-column slot: the common item's category `<select>`, over the 7 fixed
 * category values, labels sourced from `common_item_page.category.*`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.category - Current category field value.
 * @param {{onCategoryChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Category select field.
 */
function CommonItemCategoryFieldEdit({ mode, category, handlers }) {
  const id = ID_KEYS[mode];

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {Translator.t(LABEL_KEYS[mode])}
      </label>
      <select
        id={id}
        className="form-select"
        value={category}
        onChange={handlers.onCategoryChange}
      >
        {CATEGORY_VALUES.map((value) => (
          <option key={value} value={value}>
            {Translator.t(`common_item_page.category.${value}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Mode-variant category slot for the common item show/new/edit pages.
 */
const CommonItemCategoryField = {
  Show: CommonItemCategoryFieldShow, New: CommonItemCategoryFieldEdit, Edit: CommonItemCategoryFieldEdit,
};

export default CommonItemCategoryField;
