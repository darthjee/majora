import React from 'react';
import SwitchField from '../../../../../common/forms/SwitchField.jsx';
import RecipeHiddenNotice from './RecipeHiddenNotice.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

/**
 * New/edit-mode slot: the `hidden` switch (shown to every editor), plus a notice for callers
 * without game-level `can_edit`, mirroring `CommonItemHiddenField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {boolean} context.hidden - Current `hidden` switch value.
 * @param {boolean} [context.canEditGame] - Whether the caller has game-level `can_edit`.
 * @param {{onHiddenChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Hidden switch element.
 */
export default function RecipeHiddenField({
  mode, hidden, canEditGame, handlers,
}) {
  return (
    <>
      <SwitchField
        id={formFieldId(mode, 'hidden')}
        label={Translator.t(formKey(mode, 'hidden_label'))}
        checked={hidden}
        onChange={handlers.onHiddenChange}
      />
      <RecipeHiddenNotice mode={mode} hidden={hidden} canEditGame={canEditGame} />
    </>
  );
}
