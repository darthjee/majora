import React from 'react';
import TextareaField from '../../../../../common/forms/TextareaField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const LABEL_KEYS = { new: 'game_new_page.description_label', edit: 'game_edit_page.description_label' };

/**
 * New/edit-mode right-column slot: the game's description field. Shared by both modes since
 * it's visually and behaviorally identical, only the `id` and translated label differ.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.description - Current description field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onDescriptionChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Description form field.
 */
export default function GameDescriptionField({ mode, description, fieldErrors = {}, handlers }) {
  return (
    <TextareaField
      id={`game-${mode}-description`}
      label={Translator.t(LABEL_KEYS[mode])}
      value={description}
      onChange={handlers.onDescriptionChange}
      errors={fieldErrors.description ?? []}
    />
  );
}
