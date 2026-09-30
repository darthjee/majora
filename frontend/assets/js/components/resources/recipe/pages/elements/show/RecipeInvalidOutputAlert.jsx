import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';
import { formKey } from './recipeFormKeys.js';

/**
 * The "invalid output" error shown under the recipe output picker whenever the API rejected
 * `game_common_item_id` (unknown, cross-game, hidden for the caller, or missing on create).
 *
 * @param {object} props - Component props.
 * @param {'new'|'edit'} props.mode - Current page mode.
 * @param {string[]} [props.errors] - `game_common_item_id` error codes, if any.
 * @returns {React.ReactElement|null} Error alert, or null when there is no error.
 */
export default function RecipeInvalidOutputAlert({ mode, errors = [] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="alert alert-danger mt-1 mb-0 py-1" data-testid="recipe-invalid-output">
      {Translator.t(formKey(mode, 'errors.invalid_output'))}
    </div>
  );
}
