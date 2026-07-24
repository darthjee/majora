import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed. Mirrors `ItemTitle`, but document creation has no photo-upload
 * step (issue #758 scope decision), so there is no photo-upload-failed alert branch here.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
export default function DocumentTitle({ status }) {
  return (
    <>
      <h1>{Translator.t('document_new_page.title')}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t('document_new_page.error')} />}
    </>
  );
}
