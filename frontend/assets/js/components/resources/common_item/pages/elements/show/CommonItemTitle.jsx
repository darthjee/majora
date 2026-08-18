import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import CommonItemNewPhotoUploadFailedAlert from './CommonItemNewPhotoUploadFailedAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

// Common item creation uses the `common_item_new_page` translations shared by
// `GameCommonItemNewHelper`; common item editing reuses the `common_item_edit_page` translations
// `CommonItemEditHelper` uses, mirroring `PossessionTitle`'s own key selection.
const TITLE_KEYS = { new: 'common_item_new_page.title', edit: 'common_item_edit_page.title' };
const ERROR_KEYS = { new: 'common_item_new_page.error', edit: 'common_item_edit_page.error' };

/**
 * New/edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed, or (creation only) a photo-upload-failed alert with retry/skip
 * actions when the common item was created but its deferred photo upload failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Heading element.
 */
export default function CommonItemTitle({ mode, status, handlers }) {
  return (
    <>
      <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
      {mode === 'new' && status === 'photo-upload-failed' && (
        <CommonItemNewPhotoUploadFailedAlert handlers={handlers} />
      )}
    </>
  );
}
