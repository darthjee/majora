import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';
import { formKey } from './recipeFormKeys.js';

/**
 * Warns a caller without game-level `can_edit` that a hidden recipe becomes unreachable to them
 * (they are sent back to the recipes list after saving it hidden).
 *
 * @param {object} props - Component props.
 * @param {'new'|'edit'} props.mode - Current page mode.
 * @param {boolean} props.hidden - Current `hidden` switch value.
 * @param {boolean} [props.canEditGame] - Whether the caller has game-level `can_edit`.
 * @returns {React.ReactElement|null} Notice, or null when not applicable.
 */
export default function RecipeHiddenNotice({ mode, hidden, canEditGame }) {
  if (!hidden || canEditGame) {
    return null;
  }

  return (
    <div className="form-text mb-3" data-testid="recipe-hidden-notice">
      {Translator.t(formKey(mode, 'hidden_notice'))}
    </div>
  );
}
