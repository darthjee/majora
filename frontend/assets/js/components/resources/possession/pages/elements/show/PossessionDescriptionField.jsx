import React from 'react';
import MarkdownEditor from '../../../../../common/forms/MarkdownEditor.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const ID_KEYS = { new: 'possession-new-description', edit: 'possession-edit-description' };
const LABEL_KEYS = {
  new: 'possession_new_page.description_label',
  edit: 'possession_edit_page.description_label',
};

/**
 * New/edit-mode right-column slot: the possession's description field, mirroring
 * `ItemDescriptionField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.description - Current description field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onDescriptionChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Description form field.
 */
export default function PossessionDescriptionField({ mode, description, fieldErrors = {}, handlers }) {
  return (
    <MarkdownEditor
      id={ID_KEYS[mode]}
      label={Translator.t(LABEL_KEYS[mode])}
      value={description}
      onChange={handlers.onDescriptionChange}
      errors={fieldErrors.description ?? []}
    />
  );
}
