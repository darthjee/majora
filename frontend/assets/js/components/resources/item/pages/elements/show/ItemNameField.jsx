import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const ID_KEYS = { new: 'character-item-new-name', edit: 'item-edit-name' };
const LABEL_KEYS = { new: 'character_item_new_page.name_label', edit: 'item_edit_page.name_label' };

/**
 * New/edit-mode right-column slot: the item's name field.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.name - Current name field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function ItemNameField({ mode, name, fieldErrors = {}, handlers }) {
  return (
    <FormField
      id={ID_KEYS[mode]}
      type="text"
      label={Translator.t(LABEL_KEYS[mode])}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
