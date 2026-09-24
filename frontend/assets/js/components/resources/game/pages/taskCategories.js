import Translator from '../../../../i18n/Translator.js';

/**
 * Game task categories, mirroring the backend `Task.CATEGORY_CHOICES` in the same order — the
 * order the category picker lists them in, with `other` always last.
 */
export const TASK_CATEGORY_VALUES = [
  'printing', 'crafting', 'painting', 'planning', 'writing',
  'research', 'scheduling', 'buying', 'updating', 'other',
];

/**
 * Category a new task starts with, and the one shown for a missing/unknown category.
 */
export const DEFAULT_TASK_CATEGORY = 'other';

/**
 * Normalize a task category: any value missing from `TASK_CATEGORY_VALUES` (absent, or one the
 * backend gained before the frontend knew about it) becomes `DEFAULT_TASK_CATEGORY`.
 *
 * @param {string|null|undefined} value - Raw category value from the API.
 * @returns {string} A value from `TASK_CATEGORY_VALUES`.
 */
export function normalizeTaskCategory(value) {
  return TASK_CATEGORY_VALUES.includes(value) ? value : DEFAULT_TASK_CATEGORY;
}

/**
 * Translate a task category through the shared `game_task.category.<value>` key, falling back to
 * the `other` label for a missing or unknown value so a raw translation key is never shown.
 *
 * @param {string|null|undefined} value - Raw category value.
 * @returns {string} Translated category label.
 */
export function translateTaskCategory(value) {
  return Translator.t(`game_task.category.${normalizeTaskCategory(value)}`);
}

/**
 * Shape a raw category value as the `{id, name}` item `SingleResourcePickerField` expects for
 * its `value` prop in constant mode.
 *
 * @param {string|null|undefined} value - Raw category value.
 * @returns {{id: string, name: string}} Picker item for the (normalized) category.
 */
export function toTaskCategoryPick(value) {
  const category = normalizeTaskCategory(value);

  return { id: category, name: translateTaskCategory(category) };
}
