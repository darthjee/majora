import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed, mirroring `ItemTitle`/`PossessionTitle` — no `New`-mode key (and
 * no photo-upload-failed alert branch), since faction creation is modal-based
 * (`FactionNewModalHelper` renders its own title/error/photo-upload-failed alert directly, via
 * `FactionNewPhotoUploadFailedAlert`).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
export default function FactionTitle({ status }) {
  return (
    <>
      <h1>{Translator.t('faction_edit_page.title')}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t('faction_edit_page.error')} />}
    </>
  );
}
