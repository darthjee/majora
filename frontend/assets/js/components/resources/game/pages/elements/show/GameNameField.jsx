import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const LABEL_KEYS = { new: 'game_new_page.name_label', edit: 'game_edit_page.name_label' };

/**
 * New/edit-mode right-column slot: the game's name field. Shared by both modes since it's
 * visually and behaviorally identical, only the `id` and translated label differ.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.name - Current name field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function GameNameField({ mode, name, fieldErrors = {}, handlers }) {
  return (
    <FormField
      id={`game-${mode}-name`}
      type="text"
      label={Translator.t(LABEL_KEYS[mode])}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
