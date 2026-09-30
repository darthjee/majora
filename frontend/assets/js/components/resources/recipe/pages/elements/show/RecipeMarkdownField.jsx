import React from 'react';
import MarkdownEditor from '../../../../../common/forms/MarkdownEditor.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

/**
 * New/edit-mode markdown editor for one of the recipe's long-text fields (`description`,
 * `ingredients`, `checks`), mirroring `CommonItemDescriptionField`.
 *
 * @param {object} props - Component props.
 * @param {'new'|'edit'} props.mode - Current page mode.
 * @param {string} props.field - Field name (also the label key prefix, `<field>_label`).
 * @param {string} props.value - Current field value.
 * @param {Function} props.onChange - Change handler.
 * @param {object} [props.fieldErrors] - Field-level submission errors, keyed by field name.
 * @returns {React.ReactElement} Markdown editor.
 */
export default function RecipeMarkdownField({
  mode, field, value, onChange, fieldErrors = {},
}) {
  return (
    <MarkdownEditor
      id={formFieldId(mode, field)}
      label={Translator.t(formKey(mode, `${field}_label`))}
      value={value ?? ''}
      onChange={onChange}
      errors={fieldErrors[field] ?? []}
    />
  );
}
