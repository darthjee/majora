import React from 'react';
import TextareaField from '../../../../../common/forms/TextareaField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const ID_KEYS = { new: 'character-item-new-description', edit: 'item-edit-description' };
const LABEL_KEYS = {
  new: 'character_item_new_page.description_label',
  edit: 'item_edit_page.description_label',
};

/**
 * New/edit-mode right-column slot: the item's description field. `CharacterItemNewHelper` used
 * to render this through `CharacterDescriptionField`, but that component is itself a thin
 * `TextareaField` wrapper (same markup, same behavior), so both modes now share the plain
 * `TextareaField` directly, same as `ItemEditHelper` already did.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.description - Current description field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onDescriptionChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Description form field.
 */
export default function ItemDescriptionField({ mode, description, fieldErrors = {}, handlers }) {
  return (
    <TextareaField
      id={ID_KEYS[mode]}
      label={Translator.t(LABEL_KEYS[mode])}
      value={description}
      onChange={handlers.onDescriptionChange}
      errors={fieldErrors.description ?? []}
    />
  );
}
