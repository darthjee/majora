import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the document's name field.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Current name field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function DocumentNameField({ name, fieldErrors = {}, handlers }) {
  return (
    <FormField
      id="document-new-name"
      type="text"
      label={Translator.t('document_new_page.name_label')}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
