import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Possession-creation-only extra content for the title slot: a warning alert with retry/skip
 * actions, shown when the possession was created successfully but its deferred photo upload
 * failed, mirroring `ItemNewPhotoUploadFailedAlert` — "skip" proceeds to the same destination as
 * a normal successful creation (the possessions list), since there is no per-possession detail
 * page to land on yet.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Warning alert element.
 */
export default function PossessionNewPhotoUploadFailedAlert({ handlers }) {
  return (
    <div className="alert alert-warning">
      <p>{Translator.t('possession_new_page.photo_upload_failed')}</p>
      <button
        type="button"
        className="btn btn-primary me-2"
        onClick={handlers.onRetryPhotoUpload}
      >
        {Translator.t('possession_new_page.retry_photo_upload')}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handlers.onSkipPhotoUpload}
      >
        {Translator.t('possession_new_page.skip_photo_upload')}
      </button>
    </div>
  );
}
