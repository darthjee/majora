import React from 'react';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the form's submit button, disabled while a submission is in
 * flight.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Submit button.
 */
export default function DocumentSubmitButton({ status }) {
  return (
    <SubmitButton disabled={status === 'submitting'}>
      {Translator.t('document_new_page.submit')}
    </SubmitButton>
  );
}
