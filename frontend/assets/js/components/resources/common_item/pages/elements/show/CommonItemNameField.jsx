import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const ID_KEYS = { new: 'common-item-new-name', edit: 'common-item-edit-name' };
const LABEL_KEYS = { new: 'common_item_new_page.name_label', edit: 'common_item_edit_page.name_label' };

/**
 * New/edit-mode right-column slot: the common item's name field, mirroring
 * `PossessionNameField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.name - Current name field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function CommonItemNameField({ mode, name, fieldErrors = {}, handlers }) {
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
