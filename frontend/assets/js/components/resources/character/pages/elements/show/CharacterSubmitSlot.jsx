import React from 'react';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Build the new/edit-mode submit button slot for a character kind.
 *
 * @param {{edit: string, new: string}} labelKeys - Per-mode submit button i18n key, keyed by
 *   `'edit'` and/or `'new'` (PCs only ever provide `'edit'`).
 * @param {boolean} [hideWhilePhotoUploadFailed] - Whether the button is hidden while
 *   `status === 'photo-upload-failed'` (NPC creation only, matching
 *   `GameNpcNewHelper#renderSubmitButton`, which offers retry/skip buttons instead).
 * @returns {Function} New/edit-mode submit button slot component.
 */
export function buildCharacterSubmitButton(labelKeys, hideWhilePhotoUploadFailed = false) {
  return function CharacterSubmitEditOrNew({ mode, status }) {
    if (hideWhilePhotoUploadFailed && status === 'photo-upload-failed') return null;

    return (
      <SubmitButton disabled={status === 'submitting'}>
        {Translator.t(labelKeys[mode])}
      </SubmitButton>
    );
  };
}

export default buildCharacterSubmitButton;
