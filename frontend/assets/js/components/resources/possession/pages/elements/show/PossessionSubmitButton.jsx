import React from 'react';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const SUBMIT_KEYS = { new: 'possession_new_page.submit', edit: 'possession_edit_page.submit' };

/**
 * New/edit-mode right-column slot: the form's submit button, disabled while a submission is in
 * flight, mirroring `ItemSubmitButton`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Submit button.
 */
export default function PossessionSubmitButton({ mode, status }) {
  return (
    <SubmitButton disabled={status === 'submitting'}>
      {Translator.t(SUBMIT_KEYS[mode])}
    </SubmitButton>
  );
}
