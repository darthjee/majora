import { CATEGORY_VALUES } from '../../../../common_item/pages/elements/show/CommonItemCategoryField.jsx';

/**
 * Manages the category filter of the game recipes list (issue #1449): validates the hash's
 * `?category=` against the `GameCommonItem` category choices and turns a selection into a query.
 */
export default class RecipeFiltersController {
  /**
   * Reads the active category from the hash filter params, discarding any value that is not a
   * `GameCommonItem` category choice.
   *
   * @param {URLSearchParams} params - Filter params taken from the current hash.
   * @returns {string} The valid category, or `''` when absent/unknown.
   */
  static categoryFromParams(params) {
    const category = params.get('category');

    return CATEGORY_VALUES.includes(category) ? category : '';
  }

  /**
   * Builds the filter query for a selected category, omitting a blank ("all") selection.
   *
   * @param {string} category - Selected category (`''` for all).
   * @returns {{category?: string}} Query object.
   */
  static buildQuery(category) {
    return CATEGORY_VALUES.includes(category) ? { category } : {};
  }

  /**
   * Creates a new RecipeFiltersController instance.
   *
   * @param {Function} setCategory - State setter for the selected category.
   * @param {Function} onQuery - Called with the built query whenever the category changes.
   */
  constructor(setCategory, onQuery) {
    this.setCategory = setCategory;
    this.onQuery = onQuery;
  }

  /**
   * Handles a category selection: stores it and immediately applies the filter.
   *
   * @param {string} value - Newly selected category (`''` for all).
   * @returns {void}
   */
  handleCategoryChange(value) {
    this.setCategory(value);
    this.onQuery(RecipeFiltersController.buildQuery(value));
  }
}
