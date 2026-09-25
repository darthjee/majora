import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';
import { TASK_CATEGORY_VALUES } from '../../taskCategories.js';

const COMPLETED_VALUES = ['true', 'false'];

/**
 * Manages draft filter state and query building for the TaskFilters element.
 */
export default class TaskFiltersController {
  /**
   * Creates a new TaskFiltersController instance.
   *
   * @param {Function} setCategory - state setter for the draft category field.
   * @param {Function} setCompleted - state setter for the draft completed field.
   */
  constructor(setCategory, setCompleted) {
    this.setCategory = setCategory;
    this.setCompleted = setCompleted;
  }

  /**
   * Reads the initial draft values from the hash filter params, discarding a category not in
   * `TASK_CATEGORY_VALUES` or a completed value other than `'true'`/`'false'`.
   *
   * @param {URLSearchParams} params - filter params taken from the current hash.
   * @returns {{category: string, completed: string}} initial draft values, blank when unknown.
   */
  static initialFilters(params) {
    const category = params.get('category');
    const completed = params.get('completed');

    return {
      category: TASK_CATEGORY_VALUES.includes(category) ? category : '',
      completed: COMPLETED_VALUES.includes(completed) ? completed : '',
    };
  }

  /**
   * Handles a Category dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected category value.
   * @returns {void}
   */
  handleCategoryChange(value) {
    this.setCategory(value);
  }

  /**
   * Handles a Status (completed) dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected completed value (`'true'`, `'false'` or blank).
   * @returns {void}
   */
  handleCompletedChange(value) {
    this.setCompleted(value);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields.
   *
   * @param {string} category - current Category dropdown value.
   * @param {string} completed - current Status dropdown value.
   * @returns {{category?: string, completed?: string}} query params to apply, with blank fields
   *   omitted.
   */
  buildQuery(category, completed) {
    return buildFilterQuery([['category', category], ['completed', completed]]);
  }

  /**
   * Resets both draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setCategory('');
    this.setCompleted('');
  }
}
