import React from 'react';
import MarkdownEditor from '../../../../../common/forms/MarkdownEditor.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the document's description field.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.description - Current description field value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onDescriptionChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Description form field.
 */
export default function DocumentDescriptionField({ description, fieldErrors = {}, handlers }) {
  return (
    <MarkdownEditor
      id="document-new-description"
      label={Translator.t('document_new_page.description_label')}
      value={description}
      onChange={handlers.onDescriptionChange}
      errors={fieldErrors.description ?? []}
    />
  );
}
