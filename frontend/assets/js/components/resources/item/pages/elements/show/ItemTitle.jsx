import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import ItemNewPhotoUploadFailedAlert from './ItemNewPhotoUploadFailedAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

// Item creation is shared by game/PC/NPC items (issue #784) and uses the `item_new_page`
// translations shared by `GameItemNewHelper`/`CharacterItemNewHelper`; item editing is
// shared by game/PC/NPC items and reuses the `item_edit_page` translations `ItemEditHelper`
// already used.
const TITLE_KEYS = { new: 'item_new_page.title', edit: 'item_edit_page.title' };
const ERROR_KEYS = { new: 'item_new_page.error', edit: 'item_edit_page.error' };

/**
 * New/edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed, or (creation only) a photo-upload-failed alert with retry/skip
 * actions when the item was created but its deferred photo upload failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @param {{onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} context.handlers - Event
 *   handlers.
 * @returns {React.ReactElement} Heading element.
 */
export default function ItemTitle({ mode, status, handlers }) {
  return (
    <>
      <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
      {mode === 'new' && status === 'photo-upload-failed' && (
        <ItemNewPhotoUploadFailedAlert handlers={handlers} />
      )}
    </>
  );
}
