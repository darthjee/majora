import React from 'react';
import TextareaField from '../../../../../common/forms/TextareaField.jsx';

/**
 * Rendering helper for the CharacterDescriptionField element.
 */
export default class CharacterDescriptionFieldHelper {
  /**
   * Render the description textarea.
   *
   * @param {string} id - Id shared between the label's `htmlFor` and the textarea.
   * @param {string} label - Translated description field label.
   * @param {string} value - Current description value.
   * @param {Function} onChange - Change handler for the textarea.
   * @param {string[]} errors - Field-level error messages to display below the textarea.
   * @returns {React.ReactElement} Description field element.
   */
  static render(id, label, value, onChange, errors) {
    return (
      <TextareaField
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        errors={errors}
      />
    );
  }
}
