import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Common-item-creation-only extra content for the title slot: a warning alert with retry/skip
 * actions, shown when the common item was created successfully but its deferred photo upload
 * failed, mirroring `PossessionNewPhotoUploadFailedAlert` — "skip" proceeds to the same
 * destination as a normal successful creation (the common items list), since there is no
 * per-common-item detail page to land on yet.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Warning alert element.
 */
export default function CommonItemNewPhotoUploadFailedAlert({ handlers }) {
  return (
    <div className="alert alert-warning">
      <p>{Translator.t('common_item_new_page.photo_upload_failed')}</p>
      <button
        type="button"
        className="btn btn-primary me-2"
        onClick={handlers.onRetryPhotoUpload}
      >
        {Translator.t('common_item_new_page.retry_photo_upload')}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handlers.onSkipPhotoUpload}
      >
        {Translator.t('common_item_new_page.skip_photo_upload')}
      </button>
    </div>
  );
}
