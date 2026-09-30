import Translator from '../../../../i18n/Translator.js';

/**
 * Maximum number of common items the recipe output picker lists per search.
 */
export const OUTPUT_PICKER_MAX_ENTRIES = 5;

/**
 * Initial field values of the recipe new/edit form (issue #1449). `output` holds the picked
 * `{id, name}` output common item (or null), numeric fields are kept as strings like the other
 * forms' inputs.
 */
export const RECIPE_FORM_DEFAULTS = {
  name: '',
  output: null,
  yield_quantity: '1',
  crafting_time: '',
  crafting_cost: '0',
  description: '',
  ingredients: '',
  checks: '',
  hidden: false,
};

/**
 * Build the API-mode `picker` config for the recipe output `SingleResourcePickerField`: searches
 * the game's common items (`commonItem.collection`, `?name=<term>&per_page=5`).
 *
 * @param {string} gameSlug - Slug of the game whose common items are searched.
 * @returns {{resource: string, maxEntries: number, params: {gameSlug: string}}} Picker config.
 */
export function buildOutputPicker(gameSlug) {
  return { resource: 'commonItem', maxEntries: OUTPUT_PICKER_MAX_ENTRIES, params: { gameSlug } };
}

/**
 * Shape a loaded recipe's `output` as the picker's `{id, name}` value; a masked (`null`) output
 * becomes an id-less "unknown" placeholder.
 *
 * @param {{id: number, name: string}|null} output - Loaded recipe output.
 * @returns {{id: (number|null), name: string}} Picker value.
 */
export function toOutputPick(output) {
  if (!output) {
    return { id: null, name: Translator.t('recipe_page.unknown_output') };
  }

  return { id: output.id, name: output.name };
}

/**
 * Build the recipe write body from the form values, limited to the API's write fields.
 * `game_common_item_id` is only sent when an output was picked that differs from
 * `initialOutputId` (so a masked output on edit is left untouched unless the user re-picks).
 *
 * @param {object} fields - Form values (see {@link RECIPE_FORM_DEFAULTS}).
 * @param {number|null} [initialOutputId] - Output id the form was loaded with (edit only).
 * @returns {object} Request body.
 */
export function buildRecipeBody(fields, initialOutputId) {
  const body = {
    name: fields.name,
    yield_quantity: Number(fields.yield_quantity) || 1,
    crafting_time: fields.crafting_time,
    crafting_cost: Number(fields.crafting_cost) || 0,
    description: fields.description,
    ingredients: fields.ingredients,
    checks: fields.checks,
    hidden: fields.hidden,
  };
  const outputId = fields.output?.id ?? null;

  if (outputId !== null && outputId !== initialOutputId) {
    body.game_common_item_id = outputId;
  }

  return body;
}

/**
 * Pick where to go after a successful save: the recipe's show page, or the recipes list when a
 * caller without game-level `can_edit` saved it hidden (the recipe becomes unreachable to them).
 *
 * @param {string} gameSlug - Game slug.
 * @param {number|string} recipeId - Saved recipe id.
 * @param {boolean} hidden - Whether the recipe was saved hidden.
 * @param {boolean} canEditGame - Whether the caller has game-level `can_edit`.
 * @returns {string} Hash path to redirect to.
 */
export function savedRecipePath(gameSlug, recipeId, hidden, canEditGame) {
  if (hidden && !canEditGame) {
    return `/games/${gameSlug}/recipes`;
  }

  return `/games/${gameSlug}/recipes/${recipeId}`;
}
