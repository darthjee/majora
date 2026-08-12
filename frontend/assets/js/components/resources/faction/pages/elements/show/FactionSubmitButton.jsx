import React from 'react';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-mode right-column slot: the form's submit button, disabled while a submission is in
 * flight, mirroring `ItemSubmitButton`/`PossessionSubmitButton` — no `New`-mode key, since
 * faction creation is modal-based (its own `FactionNewModalHelper` renders its own
 * `SubmitButton`).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Submit button.
 */
export default function FactionSubmitButton({ status }) {
  return (
    <SubmitButton disabled={status === 'submitting'}>
      {Translator.t('faction_edit_page.submit')}
    </SubmitButton>
  );
}
