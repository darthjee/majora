import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-mode right-column slot: the faction's name field, mirroring `ItemNameField`/
 * `PossessionNameField` — no `New`-mode key, since faction creation is modal-based (its own
 * `FactionNewModalHelper` renders a plain `FormField` directly).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Current name field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function FactionNameField({ name, fieldErrors = {}, handlers }) {
  return (
    <FormField
      id="faction-edit-name"
      type="text"
      label={Translator.t('faction_edit_page.name_label')}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
