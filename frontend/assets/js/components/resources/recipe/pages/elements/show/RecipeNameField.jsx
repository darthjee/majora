import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

/**
 * New/edit-mode right-column slot: the recipe's name field, mirroring `CommonItemNameField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.name - Current name value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Name form field.
 */
export default function RecipeNameField({
  mode, name, fieldErrors = {}, handlers,
}) {
  return (
    <FormField
      id={formFieldId(mode, 'name')}
      type="text"
      label={Translator.t(formKey(mode, 'name_label'))}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
