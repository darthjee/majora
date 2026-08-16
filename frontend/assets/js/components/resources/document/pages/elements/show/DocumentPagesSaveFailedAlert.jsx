import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-page-only warning alert (issue #1129), shown when the document-level save succeeded but
 * the pages save saga (partially or fully) failed, mirroring `DocumentNewPhotoUploadFailedAlert`'s
 * shape — **Retry** re-invokes the same pages-component save entry point (which naturally resumes
 * from wherever the diff currently stands, since it always re-derives against the live page set),
 * **Skip** dismisses the alert and leaves pages in their current, possibly partial, state.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onRetry - Handler invoked when "Retry" is clicked.
 * @param {Function} props.onSkip - Handler invoked when "Skip" is clicked.
 * @returns {React.ReactElement} Warning alert element.
 */
export default function DocumentPagesSaveFailedAlert({ onRetry, onSkip }) {
  return (
    <div className="alert alert-warning">
      <p>{Translator.t('document_edit_page.pages_save_failed')}</p>
      <button type="button" className="btn btn-primary me-2" onClick={onRetry}>
        {Translator.t('document_edit_page.retry_pages_save')}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onSkip}>
        {Translator.t('document_edit_page.skip_pages_save')}
      </button>
    </div>
  );
}
