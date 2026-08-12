import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Faction-creation-only warning alert with retry/skip actions, shown when the faction was
 * created successfully but its deferred photo upload failed, mirroring
 * `PossessionNewPhotoUploadFailedAlert`/`ItemNewPhotoUploadFailedAlert` — "skip" proceeds to the
 * same destination as a normal successful creation (closing the modal and reloading the
 * factions list), since there is no per-faction detail page to land on yet. Rendered directly
 * from `FactionNewModalHelper` (the faction creation flow is modal-based, unlike
 * `Possession`/`Item`'s dedicated `/new` page, so this isn't wired through `ShowPageLayout`).
 *
 * @param {object} props - Component props.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} props.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Warning alert element.
 */
export default function FactionNewPhotoUploadFailedAlert({ handlers }) {
  return (
    <div className="alert alert-warning">
      <p>{Translator.t('faction_new_page.photo_upload_failed')}</p>
      <button
        type="button"
        className="btn btn-primary me-2"
        onClick={handlers.onRetryPhotoUpload}
      >
        {Translator.t('faction_new_page.retry_photo_upload')}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handlers.onSkipPhotoUpload}
      >
        {Translator.t('faction_new_page.skip_photo_upload')}
      </button>
    </div>
  );
}
