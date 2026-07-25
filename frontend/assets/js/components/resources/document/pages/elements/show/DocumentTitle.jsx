import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import DocumentNewPhotoUploadFailedAlert from './DocumentNewPhotoUploadFailedAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed, or a photo-upload-failed alert with retry/skip actions when the
 * document was created but its deferred photo upload failed (issue #727), mirroring `ItemTitle`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Heading element.
 */
export default function DocumentTitle({ status, handlers }) {
  return (
    <>
      <h1>{Translator.t('document_new_page.title')}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t('document_new_page.error')} />}
      {status === 'photo-upload-failed' && (
        <DocumentNewPhotoUploadFailedAlert handlers={handlers} />
      )}
    </>
  );
}
