import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import RecipeInvalidOutputAlert from './RecipeInvalidOutputAlert.jsx';
import SingleResourcePickerField from '../../../../../common/forms/SingleResourcePickerField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { buildOutputPicker } from '../../recipeForm.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

/**
 * Show-mode right-column slot: the recipe's output common item, linking to its page, or the
 * translated "unknown output" label when the output is masked (`null`).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {{id: number, name: string}|null} [context.output] - Output common item.
 * @param {string} context.game_slug - Game slug, used to build the common item link.
 * @returns {React.ReactElement} Output line.
 */
function RecipeOutputFieldShow({ output, game_slug: gameSlug }) {
  return (
    <RecipeShowLine label={Translator.t('recipe_page.output_label')}>
      {output
        ? <a href={`#/games/${gameSlug}/common_items/${output.id}`}>{output.name}</a>
        : Translator.t('recipe_page.unknown_output')}
    </RecipeShowLine>
  );
}

/**
 * New/edit-mode right-column slot: the output common item picker (API mode over the game's
 * common items, searched by name), plus the "invalid output" error.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {{id: (number|null), name: string}|null} context.output - Picked output.
 * @param {string} context.game_slug - Game slug, scoping the search.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onOutputChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Output picker field.
 */
function RecipeOutputFieldEdit({
  mode, output, game_slug: gameSlug, fieldErrors = {}, handlers,
}) {
  return (
    <div className="mb-3">
      <SingleResourcePickerField
        id={formFieldId(mode, 'output')}
        picker={buildOutputPicker(gameSlug)}
        value={output}
        onChange={handlers.onOutputChange}
        label={Translator.t(formKey(mode, 'output_label'))}
        searchPlaceholder={Translator.t(formKey(mode, 'output_placeholder'))}
      />
      <RecipeInvalidOutputAlert mode={mode} errors={fieldErrors.game_common_item_id} />
    </div>
  );
}

/**
 * Mode-variant output slot for the recipe show/new/edit pages.
 */
const RecipeOutputField = { Show: RecipeOutputFieldShow, New: RecipeOutputFieldEdit, Edit: RecipeOutputFieldEdit };

export default RecipeOutputField;
