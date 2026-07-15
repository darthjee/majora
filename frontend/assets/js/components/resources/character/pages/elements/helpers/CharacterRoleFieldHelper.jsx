import React from 'react';
import FormField from '../../../../../common/FormField.jsx';

/**
 * Rendering helper for the CharacterRoleField element.
 */
export default class CharacterRoleFieldHelper {
  /**
   * Render the role input, or null when the current editor is not a full editor.
   *
   * @param {boolean} isFullEditor - Whether the current editor may see/edit the role.
   * @param {string} id - Id shared between the label's `htmlFor` and the input.
   * @param {string} label - Translated role field label.
   * @param {string} value - Current role value.
   * @param {Function} onChange - Change handler for the input.
   * @param {string[]} errors - Field-level error messages to display below the input.
   * @returns {React.ReactElement|null} Role field element, or null.
   */
  static render(isFullEditor, id, label, value, onChange, errors) {
    if (!isFullEditor) return null;

    return (
      <FormField
        id={id}
        type="text"
        label={label}
        value={value}
        onChange={onChange}
        errors={errors}
      />
    );
  }
}
