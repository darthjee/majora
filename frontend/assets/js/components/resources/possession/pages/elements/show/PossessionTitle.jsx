import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import PossessionNewPhotoUploadFailedAlert from './PossessionNewPhotoUploadFailedAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

// Possession creation uses the `possession_new_page` translations shared by
// `GamePossessionNewHelper`; possession editing reuses the `possession_edit_page` translations
// `PossessionEditHelper` uses, mirroring `ItemTitle`'s own key selection.
const TITLE_KEYS = { new: 'possession_new_page.title', edit: 'possession_edit_page.title' };
const ERROR_KEYS = { new: 'possession_new_page.error', edit: 'possession_edit_page.error' };

/**
 * New/edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed, or (creation only) a photo-upload-failed alert with retry/skip
 * actions when the possession was created but its deferred photo upload failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Heading element.
 */
export default function PossessionTitle({ mode, status, handlers }) {
  return (
    <>
      <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
      {mode === 'new' && status === 'photo-upload-failed' && (
        <PossessionNewPhotoUploadFailedAlert handlers={handlers} />
      )}
    </>
  );
}
