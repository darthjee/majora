import React from 'react';
import TextareaField from '../../../../../common/TextareaField.jsx';

/**
 * Rendering helper for the CharacterDmNotesField element.
 */
export default class CharacterDmNotesFieldHelper {
  /**
   * Render the DM notes textarea, or null when the current editor is not a full editor.
   *
   * @param {boolean} isFullEditor - Whether the current editor may see/edit DM notes.
   * @param {string} id - Id shared between the label's `htmlFor` and the textarea.
   * @param {string} label - Translated DM notes field label.
   * @param {string} value - Current private description value.
   * @param {Function} onChange - Change handler for the textarea.
   * @param {string[]} errors - Field-level error messages to display below the textarea.
   * @returns {React.ReactElement|null} DM notes field element, or null.
   */
  static render(isFullEditor, id, label, value, onChange, errors) {
    if (!isFullEditor) return null;

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
