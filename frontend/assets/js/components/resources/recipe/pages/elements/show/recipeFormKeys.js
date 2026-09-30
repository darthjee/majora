/**
 * Translation namespace of the recipe form for each mode (issue #1449): creation uses
 * `recipe_new_page`, editing uses `recipe_edit_page`.
 */
export const FORM_NAMESPACES = { new: 'recipe_new_page', edit: 'recipe_edit_page' };

/**
 * Build the translation key of a recipe form label for the given mode.
 *
 * @param {'new'|'edit'} mode - Current page mode.
 * @param {string} key - Key inside the mode's namespace (e.g. `name_label`).
 * @returns {string} Full translation key.
 */
export function formKey(mode, key) {
  return `${FORM_NAMESPACES[mode]}.${key}`;
}

/**
 * Build the DOM id of a recipe form field for the given mode.
 *
 * @param {'new'|'edit'} mode - Current page mode.
 * @param {string} field - Field suffix (e.g. `name`).
 * @returns {string} DOM id (e.g. `recipe-new-name`).
 */
export function formFieldId(mode, field) {
  return `recipe-${mode}-${field}`;
}
